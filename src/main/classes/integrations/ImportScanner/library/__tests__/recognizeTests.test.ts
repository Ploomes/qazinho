import { describe, expect, it } from 'vitest';
import { recognizeTests } from '@/main/classes/integrations/ImportScanner/library';

describe('recognizeTests', () => {
  it('recognizes Playwright by its config and counts its spec files', () => {
    expect(
      recognizeTests({
        files: [
          'playwright.config.ts',
          'tests/cart.spec.ts',
          'tests/login.spec.ts',
          'README.md',
        ],
        manifests: '',
        flows: [],
      }),
    ).toEqual({
      frameworks: [{ id: 'playwright', files: 2 }],
      tests: ['tests/cart.spec.ts', 'tests/login.spec.ts'],
    });
  });

  it('recognizes Maestro flows next to Playwright and gives each file to one', () => {
    const { frameworks, tests } = recognizeTests({
      files: ['a.spec.ts', 'playwright.config.ts', '.maestro/login.yaml'],
      manifests: '',
      flows: ['.maestro/login.yaml'],
    });

    expect(frameworks).toEqual([
      { id: 'playwright', files: 1 },
      { id: 'maestro', files: 1 },
    ]);
    expect(tests).toEqual(['a.spec.ts', '.maestro/login.yaml']);
  });

  it('gives a Cypress spec to Cypress, not to the generic spec pattern', () => {
    expect(
      recognizeTests({
        files: ['cypress.config.ts', 'cypress/e2e/home.cy.ts'],
        manifests: '"cypress": "^13"',
        flows: [],
      }).frameworks,
    ).toEqual([{ id: 'cypress', files: 1 }]);
  });

  it('does not report a package that no test file goes with', () => {
    expect(
      recognizeTests({
        files: ['src/app.ts'],
        manifests: '"playwright-core": "1"',
        flows: [],
      }),
    ).toEqual({ frameworks: [], tests: [] });
  });

  it('reports a framework by its package when test files exist', () => {
    expect(
      recognizeTests({
        files: ['tests/test_login.py'],
        manifests: 'pytest-playwright==0.5',
        flows: [],
      }).frameworks,
    ).toEqual([{ id: 'playwright', files: 1 }]);
  });

  it('sorts the frameworks by how many files they hold', () => {
    const { frameworks } = recognizeTests({
      files: ['playwright.config.ts', 'a.spec.ts', 'f1.yaml', 'f2.yaml'],
      manifests: '',
      flows: ['f1.yaml', 'f2.yaml'],
    });

    expect(frameworks.map(({ id }) => id)).toEqual(['maestro', 'playwright']);
  });
});
