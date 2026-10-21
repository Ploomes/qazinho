import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';
import type { IFlatStep, IStepAction, IViewport } from '@/shared/types';
import { ordinalOf, sampleFileOf, withoutRole } from '@/main/library';

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

async function reopen(page: Page): Promise<Page> {
  const next = prepare(await page.context().newPage());

  await page.close();
  await next.goto(APP);

  return next;
}
`;

function quoted(text: string): string {
  return JSON.stringify(text);
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
      return [`await tab.goto(${quoted(action.target)});`];
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
  }
}

/** A Playwright test file for the cases a web app's runs recorded, each case a test that starts anew and checks each step's proof. */
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
        `  await expect(tab.getByText(${quoted(kept?.proof ?? '')}).first()).toBeVisible();`,
      ];
    });

    return [
      `test(${quoted(`${first?.caseId ?? recipe.caseId} · ${first?.caseTitle ?? ''}`)}, async ({ page }) => {`,
      '  let tab = prepare(page);',
      '',
      '  await tab.goto(APP);',
      ...body,
      '});',
    ].join('\n');
  });

  return [
    "import { expect, test, type Page } from '@playwright/test';",
    '',
    `const APP = ${quoted(props.url)};`,
    '',
    HELPERS,
    `test.use({ viewport: { width: ${String(props.viewport.width)}, height: ${String(props.viewport.height)} } });`,
    '',
    tests.join('\n\n'),
    '',
  ].join('\n');
}
