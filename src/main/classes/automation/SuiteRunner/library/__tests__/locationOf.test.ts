import { describe, expect, it } from 'vitest';
import { locationOf } from '@/main/classes/automation/SuiteRunner/library';

describe('locationOf', () => {
  it('keeps the line of a test, its path matching only itself', () => {
    expect(locationOf('tests/hc-1139/ct-nav.spec.ts:42')).toBe(
      'tests/hc-1139/ct-nav\\.spec\\.ts:42',
    );
  });

  it('takes a whole file or a folder', () => {
    expect(locationOf('tests/hc-15/')).toBe('tests/hc-15/');
    expect(locationOf('tests/a.spec.ts')).toBe('tests/a\\.spec\\.ts');
  });

  /** Playwright reads each filter as a regular expression: a bracket or a plus in a folder's name must stay a character. */
  it('escapes what a regular expression would read otherwise', () => {
    expect(locationOf('tests/(old)/a+b.spec.ts:7')).toBe(
      'tests/\\(old\\)/a\\+b\\.spec\\.ts:7',
    );
  });
});
