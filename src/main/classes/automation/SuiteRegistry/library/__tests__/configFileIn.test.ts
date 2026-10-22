import { describe, expect, it } from 'vitest';
import { configFileIn } from '@/main/classes/automation/SuiteRegistry/library';

describe('configFileIn', () => {
  it('finds the Playwright config among the files of a suite', () => {
    expect(configFileIn(['package.json', 'playwright.config.ts', 'tests'])).toBe(
      'playwright.config.ts',
    );
    expect(configFileIn(['playwright.config.mjs'])).toBe('playwright.config.mjs');
  });

  it('takes the TypeScript one when a folder keeps both', () => {
    expect(configFileIn(['playwright.config.js', 'playwright.config.ts'])).toBe(
      'playwright.config.ts',
    );
  });

  it('finds none in a folder that is not a Playwright suite', () => {
    expect(configFileIn(['package.json', 'cypress.config.ts'])).toBeNull();
    expect(configFileIn([])).toBeNull();
  });
});
