import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';
import type { IFlatStep, IStepAction, IViewport } from '@/shared/types';
import { ordinalOf, proofLinesOf, sampleFileOf, withoutRole } from '@/main/library';
import { variablesIn } from './variablesIn';

const WHEEL: Record<string, string> = {
  down: '0, 600',
  up: '0, -600',
  right: '600, 0',
  left: '-600, 0',
};

const HELPERS = `const answer: { ok: boolean; text?: string } = { ok: true };

function prepare(page: Page): Page {
  page.on('dialog', (dialog) => void (answer.ok ? dialog.accept(answer.text) : dialog.dismiss()));

  return page;
}

function control(page: Page, name: string, nth = 0) {
  return page
    .getByRole('button', { name })
    .or(page.getByRole('link', { name }))
    .or(page.getByText(name, { exact: true }))
    .nth(nth);
}

function field(page: Page, name: string, nth = 0) {
  return page
    .getByLabel(name)
    .or(page.getByPlaceholder(name))
    .or(page.getByRole('textbox', { name }))
    .nth(nth);
}

async function screenOf(page: Page): Promise<string> {
  const text = await page.locator('body').innerText();
  const fields = await page
    .locator('input, textarea, select, [aria-label]')
    .evaluateAll((all) =>
      all.flatMap((one) => [
        (one as HTMLInputElement).value ?? '',
        (one as HTMLInputElement).placeholder ?? '',
        one.getAttribute('aria-label') ?? '',
      ]),
    );

  return plain([text, ...fields].join('\\n'));
}

function plain(text: string): string {
  return text.toLowerCase().replace(/\\s+/g, ' ').trim();
}

async function shows(page: Page, words: string): Promise<void> {
  await expect
    .poll(() => screenOf(page), { message: \`The screen should show: \${words}\` })
    .toContain(plain(words));
}

async function reopen(page: Page): Promise<Page> {
  const next = prepare(await page.context().newPage());

  await page.close();
  await next.goto(APP);

  return next;
}
`;

const SCREENS = `async function newScreen(
  screens: Page[],
  context: BrowserContext,
  url: string,
): Promise<Page> {
  const next = prepare(await context.newPage());

  screens.push(next);
  await next.goto(url);

  return next;
}

async function closeScreen(screens: Page[], page: Page): Promise<Page> {
  await page.close();

  return screens.filter((one) => !one.isClosed()).at(-1) as Page;
}
`;

const VARIABLE = `function variable(name: string): string {
  const value = process.env[name];

  if (value === undefined) throw new Error(\`Set \${name} in the environment to run these tests.\`);

  return value;
}
`;

/**
 * Um arquivo de teste Playwright para os casos que as runs de um app web gravaram, cada
 * um um teste que começa de novo e confere as provas; variável vem do ambiente.
 */
export function playwrightOf(props: {
  url: string;
  viewport: IViewport;
  cases: { steps: IFlatStep[]; recipe: ICaseRecipe }[];
}): string {
  const tests = props.cases.map(({ steps, recipe }) => {
    const [first] = steps;
    const body = steps.flatMap((step) => {
      const kept = recipe.steps.find(({ number }) => number === step.numberInCase);

      return [
        `  // ${String(step.numberInCase)}. ${step.action} → ${step.expected}`,
        ...(kept?.actions ?? []).flatMap(lineOf).map((line) => `  ${line}`),
        ...shownOf(kept?.proof ?? '').map(
          (shown) => `  await shows(tab, ${quoted(shown)});`,
        ),
      ];
    });

    return [
      `test(${quoted(`${first?.caseId ?? recipe.caseId} · ${first?.caseTitle ?? ''}`)}, async ({ page }) => {`,
      '  let tab = prepare(page);',
      ...(usesScreens(recipe) ? ['  const screens = [tab];'] : []),
      '',
      '  await tab.goto(APP);',
      ...body,
      '});',
    ].join('\n');
  });

  const variables = variablesIn(props.cases.map(({ recipe }) => recipe));
  const hasScreens = props.cases.some(({ recipe }) => usesScreens(recipe));

  return [
    `import { expect, test, ${hasScreens ? 'type BrowserContext, ' : ''}type Page } from '@playwright/test';`,
    '',
    ...(variables.length === 0
      ? []
      : [
          `// Types the project's variables from the environment: ${variables.join(', ')}.`,
          '',
        ]),
    `const APP = ${quoted(props.url)};`,
    '',
    HELPERS,
    ...(hasScreens ? [SCREENS] : []),
    ...(variables.length === 0 ? [] : [VARIABLE]),
    `test.use({ viewport: { width: ${String(props.viewport.width)}, height: ${String(props.viewport.height)} } });`,
    '',
    tests.join('\n\n'),
    '',
  ].join('\n');
}

function usesScreens(recipe: ICaseRecipe): boolean {
  return recipe.steps.some(({ actions }) => actions.some(({ kind }) => kind === 'tab'));
}

function quoted(text: string): string {
  const parts = text.split(/(\$\{[A-Z][A-Z0-9_]*\})/);

  if (parts.length === 1) return JSON.stringify(text);

  return `\`${parts
    .map((part) => {
      const name = /^\$\{([A-Z][A-Z0-9_]*)\}$/.exec(part)?.[1];

      return name === undefined
        ? part.replace(/[\\`]|\$\{/g, (found) => `\\${found}`)
        : `\${variable(${JSON.stringify(name)})}`;
    })
    .join('')}\``;
}

function aimed(target: string): string {
  const { name, nth } = ordinalOf(withoutRole(target) ?? target);

  return nth === 0 ? quoted(name) : `${quoted(name)}, ${String(nth)}`;
}

function aimOf(action: IStepAction): string {
  return action.locator === undefined
    ? `control(tab, ${aimed(action.target)})`
    : `tab.${action.locator}`;
}

function lineOf(action: IStepAction): string[] {
  const dialog =
    action.dialog === 'cancel'
      ? ['answer.ok = false;']
      : action.promptText === undefined
        ? []
        : [`answer.text = ${quoted(action.promptText)};`];
  const reset =
    dialog.length === 0 ? [] : ['answer.ok = true;', 'answer.text = undefined;'];

  switch (action.kind) {
    case 'goto':
      return [
        action.target.startsWith('/')
          ? `await tab.goto(new URL(${quoted(action.target)}, APP).href);`
          : `await tab.goto(${quoted(action.target)});`,
      ];
    case 'reopen':
      return ['tab = await reopen(tab);'];
    case 'click':
      return [
        ...dialog,
        action.locator === undefined
          ? `await control(tab, ${aimed(action.target)}).click();`
          : `await tab.${action.locator}.click();`,
        ...reset,
      ];
    case 'fill':
      return [
        action.locator === undefined
          ? `await field(tab, ${aimed(action.target)}).fill(${quoted(action.value)});`
          : action.option === undefined
            ? `await tab.${action.locator}.fill(${quoted(action.value)});`
            : `await tab.${action.locator}.selectOption(${quoted(action.option)});`,
      ];
    case 'press':
      return [
        ...dialog,
        `await tab.keyboard.press(${quoted(action.target || 'Enter')});`,
        ...reset,
      ];
    case 'wait':
      return [`await tab.waitForTimeout(${String(Number(action.value) || 1_000)});`];
    case 'scroll':
      return action.target.trim() === ''
        ? [`await tab.mouse.wheel(${WHEEL[action.value] ?? WHEEL.down ?? '0, 600'});`]
        : [
            `await tab.getByText(${quoted(action.target)}).first().scrollIntoViewIfNeeded();`,
          ];
    case 'long_press':
      return [`await ${aimOf(action)}.click({ delay: 800 });`];
    case 'drag':
      return [
        `await ${aimOf(action)}.dragTo(${action.toLocator === undefined ? `control(tab, ${aimed(action.value)})` : `tab.${action.toLocator}`});`,
      ];
    case 'hover':
      return [`await ${aimOf(action)}.hover();`];
    case 'upload':
      return [
        'await Promise.all([',
        "  tab.waitForEvent('filechooser').then((chooser) =>",
        `    chooser.setFiles(${quoted(`files/${sampleFileOf(action.value).name}`)}),`,
        '  ),',
        `  ${aimOf(action)}.click(),`,
        ']);',
      ];
    case 'tab':
      return screenLines(action);
  }
}

function screenLines(action: IStepAction): string[] {
  const url = action.value === '' ? 'APP' : quoted(action.value);
  const named = `screens[${String(Number(action.value) - 1)}]`;

  switch (action.target) {
    case 'new':
      return [`tab = await newScreen(screens, tab.context(), ${url});`];
    case 'new_session':
      return [
        `tab = await newScreen(screens, await tab.context().browser()!.newContext(), ${url});`,
      ];
    case 'switch':
      return [`tab = ${named}!;`];
    default:
      return [
        `tab = await closeScreen(screens, ${action.value === '' ? 'tab' : `${named}!`});`,
      ];
  }
}

function shownOf(proof: string): string[] {
  const lines = proofLinesOf(proof);

  return lines.length === 0 ? [proof] : lines;
}
