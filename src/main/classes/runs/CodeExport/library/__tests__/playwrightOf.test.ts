import { describe, expect, it } from 'vitest';
import { playwrightOf } from '@/main/classes/runs/CodeExport/library';
import { RECIPE, SIGN_IN, STEPS } from './fixtures';

const FILE = playwrightOf({
  url: 'https://loja.test/',
  viewport: { width: 1280, height: 800 },
  cases: [{ steps: STEPS, recipe: RECIPE }],
});

describe('playwrightOf', () => {
  /** O teste exportado não tem a tela do arquivo: conferir nela quebraria na aba do app. */
  it('leaves reading a downloaded file to a person, and carries on after it', () => {
    const code = playwrightOf({
      url: 'https://app.test',
      viewport: { width: 1280, height: 800 },
      cases: [
        {
          steps: [1, 2, 3].map((numberInCase) => ({
            caseId: 'TC-01',
            caseTitle: 'Baixar',
            numberInCase,
            action: `Passo ${String(numberInCase)}`,
            expected: 'Certo',
          })) as never,
          recipe: {
            caseId: 'TC-01',
            steps: [
              {
                number: 1,
                actions: [
                  { kind: 'click', target: 'Baixar', value: '' },
                  { kind: 'open_download', target: '', value: '' },
                ],
                proof: 'Total no PDF',
              },
              {
                number: 2,
                actions: [{ kind: 'scroll', target: '', value: 'down' }],
                proof: 'Rodapé no PDF',
              },
              {
                number: 3,
                actions: [
                  { kind: 'tab', target: 'close', value: '' },
                  { kind: 'click', target: 'Voltar', value: '' },
                ],
                proof: 'Na tela do app',
              },
            ],
          } as never,
        },
      ],
    });

    expect(code).toContain('check it by hand here');
    expect(code).not.toContain('Total no PDF');
    expect(code).not.toContain('Rodapé no PDF');
    expect(code).not.toContain('closeScreen(screens');
    expect(code).toContain('Na tela do app');
  });

  it('opens the app anew for each case, at the size the QA runs it', () => {
    expect(FILE).toContain('const APP = "https://loja.test/";');
    expect(FILE).toContain('test.use({ viewport: { width: 1280, height: 800 } });');
    expect(FILE).toContain('test("TC-01 · Buy the second shirt", async ({ page }) => {');
    expect(FILE).toContain('  await tab.goto(APP);');
  });

  it('does each step the way the run did it, and checks its proof', () => {
    expect(FILE).toContain('  // 2. Buy the second shirt → The cart reads 1 (R$ 79,90)');
    expect(FILE).toContain('  await field(tab, "E-mail").fill("qa@loja.test");');
    expect(FILE).toContain('  await tab.keyboard.press("Enter");');
    expect(FILE).toContain('  await control(tab, "Comprar", 1).click();');
    expect(FILE).toContain('  await tab.waitForTimeout(500);');
    expect(FILE).toContain('  tab = await reopen(tab);');
    expect(FILE).toContain('  await shows(tab, "Carrinho 1 (R$ 79,90)");');
  });

  it('opens, moves between and closes screens, each account in its own context', () => {
    const file = playwrightOf({
      url: 'https://loja.test/',
      viewport: { width: 1280, height: 800 },
      cases: [
        {
          steps: STEPS,
          recipe: {
            ...RECIPE,
            steps: RECIPE.steps.map((step) =>
              step.number === 2
                ? {
                    ...step,
                    actions: [
                      { kind: 'tab', target: 'new_session', value: '' },
                      { kind: 'tab', target: 'switch', value: '1' },
                      { kind: 'tab', target: 'new', value: 'https://loja.test/b' },
                      { kind: 'tab', target: 'close', value: '2' },
                    ],
                  }
                : step,
            ),
          },
        },
      ],
    });

    expect(file).toContain("type BrowserContext, type Page } from '@playwright/test'");
    expect(file).toContain('  const screens = [tab];');
    expect(file).toContain(
      '  tab = await newScreen(screens, await tab.context().browser()!.newContext(), APP);',
    );
    expect(file).toContain('  tab = screens[0]!;');
    expect(file).toContain(
      '  tab = await newScreen(screens, tab.context(), "https://loja.test/b");',
    );
    expect(file).toContain('  tab = await closeScreen(screens, screens[1]!);');
  });

  it('leaves the screens helpers out of a file with one screen', () => {
    expect(FILE).not.toContain('newScreen');
    expect(FILE).not.toContain('BrowserContext');
  });

  it('checks each line of a proof that holds several', () => {
    const file = playwrightOf({
      url: 'https://loja.test/',
      viewport: { width: 1280, height: 800 },
      cases: [
        {
          steps: STEPS,
          recipe: {
            ...RECIPE,
            steps: RECIPE.steps.map((step) =>
              step.number === 2
                ? { ...step, proof: '1 item: Camiseta\nTotal: R$ 79,90' }
                : step,
            ),
          },
        },
      ],
    });

    expect(file).toContain(
      '  await shows(tab, "1 item: Camiseta");\n  await shows(tab, "Total: R$ 79,90");',
    );
  });

  it('finds a target with the very locator the run used, and picks the option a dropdown took', () => {
    const file = playwrightOf({
      url: 'https://loja.test/',
      viewport: { width: 1280, height: 800 },
      cases: [
        {
          steps: STEPS,
          recipe: {
            ...RECIPE,
            steps: [
              {
                number: 1,
                actions: [
                  {
                    kind: 'click',
                    target: 'Entrar #2',
                    value: '',
                    locator:
                      "locator('button, a, input, select, textarea, [role=button]').nth(5)",
                  },
                  {
                    kind: 'fill',
                    target: 'Estado',
                    value: 'São Paulo',
                    locator: "getByLabel('Estado', { exact: true }).visible().first()",
                    option: 'SP',
                  },
                ],
                proof: 'Sair',
              },
            ],
          },
        },
      ],
    });

    expect(file).toContain(
      "  await tab.locator('button, a, input, select, textarea, [role=button]').nth(5).click();",
    );
    expect(file).toContain(
      '  await tab.getByLabel(\'Estado\', { exact: true }).visible().first().selectOption("SP");',
    );
  });

  it('does the gestures the run did: scroll, long press, drag, hover and upload', () => {
    const file = playwrightOf({
      url: 'https://loja.test/',
      viewport: { width: 1280, height: 800 },
      cases: [
        {
          steps: STEPS,
          recipe: {
            ...RECIPE,
            steps: [
              {
                number: 1,
                actions: [
                  { kind: 'scroll', target: 'Rodapé', value: 'down' },
                  { kind: 'scroll', target: '', value: 'up' },
                  { kind: 'long_press', target: 'Card A', value: '' },
                  {
                    kind: 'drag',
                    target: 'Card A',
                    value: 'Feito',
                    locator: "getByText('Card A', { exact: true }).visible().first()",
                    toLocator: "getByText('Feito', { exact: true }).visible().first()",
                  },
                  { kind: 'hover', target: 'Ajuda', value: '' },
                  { kind: 'upload', target: 'Foto', value: 'image' },
                  {
                    kind: 'upload',
                    target: 'Anexar',
                    value: 'a.html, b.png',
                    files: ['/qa/lote/a.html', '/qa/lote/b.png'],
                  },
                  {
                    kind: 'upload',
                    target: 'Nota',
                    value: 'nota.pdf',
                    files: ['/qa/nota.pdf'],
                  },
                ],
                proof: 'Card A',
              },
            ],
          },
        },
      ],
    });

    expect(file).toContain(
      '  await tab.getByText("Rodapé").first().scrollIntoViewIfNeeded();',
    );
    expect(file).toContain('  await tab.mouse.wheel(0, -600);');
    expect(file).toContain('  await control(tab, "Card A").click({ delay: 800 });');
    expect(file).toContain(
      "  await tab.getByText('Card A', { exact: true }).visible().first().dragTo(tab.getByText('Feito', { exact: true }).visible().first());",
    );
    expect(file).toContain('  await control(tab, "Ajuda").hover();');
    expect(file).toContain('chooser.setFiles("files/qazinho-sample.png")');
    expect(file).toContain('chooser.setFiles(["files/a.html", "files/b.png"])');
    expect(file).toContain('chooser.setFiles("files/nota.pdf")');
  });

  it('cancels only the dialog a step said to cancel, and answers the rest OK', () => {
    expect(FILE).toContain(
      [
        '  answer.ok = false;',
        '  await control(tab, "Remover").click();',
        '  answer.ok = true;',
      ].join('\n'),
    );
    expect(FILE).toContain('dialog.accept(answer.text)');
  });
  it("types a project's variable from the environment, and checks a proof that names one", () => {
    const file = playwrightOf({
      url: 'https://loja.test/',
      viewport: { width: 1280, height: 800 },
      cases: [{ steps: STEPS, recipe: SIGN_IN }],
    });

    expect(file).toContain(
      "// Types the project's variables from the environment: SHOP_EMAIL, SHOP_PASSWORD.",
    );
    expect(file).toContain('function variable(name: string): string {');
    expect(file).toContain(
      '  await field(tab, "E-mail").fill(`${variable("SHOP_EMAIL")}`);',
    );
    expect(file).toContain(
      '  await field(tab, "Senha").fill(`pre\\`fix ${variable("SHOP_PASSWORD")}`);',
    );
    expect(file).toContain('  await shows(tab, `Welcome, ${variable("SHOP_EMAIL")}.`);');
  });

  it('does NOT add the environment helper to a file with no variable', () => {
    expect(FILE).not.toContain('function variable(');
    expect(FILE).not.toContain('from the environment');
  });

  it('goes to a recorded path on whatever address the file runs against', () => {
    const [step] = RECIPE.steps;
    const file = playwrightOf({
      url: 'https://loja.test/',
      viewport: { width: 1280, height: 800 },
      cases: [
        {
          steps: STEPS,
          recipe: {
            ...RECIPE,
            steps: [
              {
                ...(step as (typeof RECIPE.steps)[number]),
                actions: [{ kind: 'goto', target: '/carrinho', value: '' }],
              },
            ],
          },
        },
      ],
    });

    expect(file).toContain('await tab.goto(new URL("/carrinho", APP).href);');
  });
});
