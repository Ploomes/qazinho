import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { locationOf } from '@/main/classes/automation/SuiteRunner/library';

/**
 * A leitura do próprio Playwright de um filtro na linha de comando dele: a parte do
 * caminho vira uma expressão regular testada no caminho absoluto de cada arquivo de
 * teste, e a linha fica à parte.
 */
const playwright = createRequire(import.meta.url)('playwright/lib/util') as {
  parseLocationArg: (arg: string) => { file: string; line: number | null };
  forceRegExp: (pattern: string) => RegExp;
  createFileMatcher: (pattern: RegExp) => (file: string) => boolean;
};

/**
 * Se o Playwright, recebendo o que o locationOf fez, roda um teste escrito neste arquivo
 * nesta linha.
 */
function runs(props: { filter: string; file: string; line: number }): boolean {
  const location = playwright.parseLocationArg(locationOf(props.filter));
  const isFile = playwright.createFileMatcher(playwright.forceRegExp(location.file));

  return isFile(props.file) && (location.line === null || location.line === props.line);
}

describe('locationOf', () => {
  it('keeps the line of a test, its path matching only itself', () => {
    expect(locationOf('tests/hc-1139/ct-nav.spec.ts:42')).toBe(
      '(^|[\\\\/])tests[\\\\/]hc-1139[\\\\/]ct-nav\\.spec\\.ts$:42',
    );
    expect(
      runs({
        filter: 'tests/hc-1139/ct-nav.spec.ts:42',
        file: '/Users/qa/e2e/tests/hc-1139/ct-nav.spec.ts',
        line: 42,
      }),
    ).toBe(true);
    expect(
      runs({
        filter: 'tests/hc-1139/ct-nav.spec.ts:42',
        file: '/Users/qa/e2e/tests/hc-1139/ct-nav.spec.ts',
        line: 57,
      }),
    ).toBe(false);
  });

  it('runs a whole file, wherever the suite sits', () => {
    expect(
      runs({
        filter: 'tests/a.spec.ts',
        file: '/Users/qa/Documents/e2e/tests/a.spec.ts',
        line: 9,
      }),
    ).toBe(true);
  });

  /**
   * O nome de um arquivo dentro de outro: a.spec.ts está em data.spec.ts, e
   * tests/a.spec.ts em old-tests/a.spec.ts.
   */
  it('never runs a file whose path only holds the one asked for', () => {
    expect(
      runs({ filter: 'a.spec.ts', file: '/Users/qa/e2e/data.spec.ts', line: 1 }),
    ).toBe(false);
    expect(
      runs({
        filter: 'tests/a.spec.ts',
        file: '/Users/qa/e2e/old-tests/a.spec.ts',
        line: 1,
      }),
    ).toBe(false);
    expect(
      runs({
        filter: 'tests/a.spec.ts',
        file: '/Users/qa/e2e/tests/a.spec.ts.snap',
        line: 1,
      }),
    ).toBe(false);
  });

  /**
   * O Playwright lê cada filtro como uma expressão regular: um colchete ou um mais no
   * nome de uma pasta precisa continuar um caractere.
   */
  it('escapes what a regular expression would read otherwise', () => {
    expect(locationOf('tests/(old)/a+b.spec.ts:7')).toBe(
      '(^|[\\\\/])tests[\\\\/]\\(old\\)[\\\\/]a\\+b\\.spec\\.ts$:7',
    );
    expect(
      runs({
        filter: 'tests/(old)/a+b.spec.ts:7',
        file: '/Users/qa/e2e/tests/(old)/a+b.spec.ts',
        line: 7,
      }),
    ).toBe(true);
  });

  /**
   * O Playwright testa o filtro no caminho absoluto, que no Windows é escrito com barras
   * invertidas.
   */
  it('runs the file on Windows, where its path has backslashes', () => {
    expect(
      runs({
        filter: 'tests/hc-1139/ct-nav.spec.ts:42',
        file: 'C:\\Users\\qa\\e2e\\tests\\hc-1139\\ct-nav.spec.ts',
        line: 42,
      }),
    ).toBe(true);
    expect(
      runs({
        filter: 'a.spec.ts',
        file: 'C:\\Users\\qa\\e2e\\data.spec.ts',
        line: 1,
      }),
    ).toBe(false);
  });
});
