import type { ISuiteChangeFile } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { specFilesOf } from '@/main/classes/automation/SuiteChanges/library';

const file = (
  path: string,
  status: ISuiteChangeFile['status'] = 'modified',
): ISuiteChangeFile => ({
  path,
  status,
  additions: 1,
  deletions: 0,
  patch: '',
});

describe('specFilesOf', () => {
  it('takes the spec files the change added or touched, from the suite folder', () => {
    expect(
      specFilesOf({
        files: [
          file('e2e/tests/hc-1/ct-cart.spec.ts', 'added'),
          file('e2e/tests/hc-1/ct-nav.spec.ts'),
          file('e2e/pages/cart.page.ts', 'added'),
          file('e2e/tests/login.test.js'),
        ],
        prefix: 'e2e',
      }),
    ).toEqual([
      'tests/hc-1/ct-cart.spec.ts',
      'tests/hc-1/ct-nav.spec.ts',
      'tests/login.test.js',
    ]);
  });

  it('leaves out what the change deleted, and what sits outside the suite', () => {
    expect(
      specFilesOf({
        files: [file('e2e/tests/old.spec.ts', 'deleted'), file('app/src/x.spec.ts')],
        prefix: 'e2e',
      }),
    ).toEqual([]);
  });

  it('reads a suite at the root of its repository', () => {
    expect(specFilesOf({ files: [file('tests/a.spec.ts')], prefix: '' })).toEqual([
      'tests/a.spec.ts',
    ]);
  });

  /**
   * No Windows a pasta da suíte vem do path.relative, com barras invertidas, enquanto o
   * git escreve barras.
   */
  it("reads a suite's folder written with Windows backslashes", () => {
    expect(
      specFilesOf({ files: [file('e2e/tests/a.spec.ts')], prefix: 'e2e\\' }),
    ).toEqual(['tests/a.spec.ts']);
  });
});
