import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { locationOf } from '@/main/classes/automation/SuiteRunner/library';

/** Playwright's own reading of a filter on its command line: the path part becomes a regular expression tried on each test file's absolute path, and the line is kept apart. */
const playwright = createRequire(import.meta.url)('playwright/lib/util') as {
  parseLocationArg: (arg: string) => { file: string; line: number | null };
  forceRegExp: (pattern: string) => RegExp;
  createFileMatcher: (pattern: RegExp) => (file: string) => boolean;
};

/** Whether Playwright, handed what locationOf made, runs a test written in this file at this line. */
function runs(props: { filter: string; file: string; line: number }): boolean {
  const location = playwright.parseLocationArg(locationOf(props.filter));
  const isFile = playwright.createFileMatcher(playwright.forceRegExp(location.file));

  return isFile(props.file) && (location.line === null || location.line === props.line);
}

describe('locationOf', () => {
  it('keeps the line of a test, its path matching only itself', () => {
    expect(locationOf('tests/hc-1139/ct-nav.spec.ts:42')).toBe(
      '(^|/)tests/hc-1139/ct-nav\\.spec\\.ts$:42',
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

  /** A file's name inside another's: a.spec.ts is in data.spec.ts, and tests/a.spec.ts in old-tests/a.spec.ts. */
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

  /** Playwright reads each filter as a regular expression: a bracket or a plus in a folder's name must stay a character. */
  it('escapes what a regular expression would read otherwise', () => {
    expect(locationOf('tests/(old)/a+b.spec.ts:7')).toBe(
      '(^|/)tests/\\(old\\)/a\\+b\\.spec\\.ts$:7',
    );
    expect(
      runs({
        filter: 'tests/(old)/a+b.spec.ts:7',
        file: '/Users/qa/e2e/tests/(old)/a+b.spec.ts',
        line: 7,
      }),
    ).toBe(true);
  });
});
