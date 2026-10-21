import { describe, expect, it } from 'vitest';
import { playwrightOf } from '@/main/classes/runs/CodeExport/library';
import { RECIPE, STEPS } from './fixtures';

const FILE = playwrightOf({
  url: 'https://loja.test/',
  viewport: { width: 1280, height: 800 },
  cases: [{ steps: STEPS, recipe: RECIPE }],
});

describe('playwrightOf', () => {
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
    expect(FILE).toContain(
      '  await expect(tab.getByText("Carrinho 1 (R$ 79,90)").first()).toBeVisible();',
    );
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
});
