import { describe, expect, it } from 'vitest';
import { runnerPathsOf } from '@/main/classes/automation/SuiteRegistry/library';

describe('runnerPathsOf', () => {
  it('looks in the suite first, then in each folder above it', () => {
    expect(runnerPathsOf('/repos/web/e2e')).toEqual([
      '/repos/web/e2e/node_modules/@playwright/test/package.json',
      '/repos/web/node_modules/@playwright/test/package.json',
      '/repos/node_modules/@playwright/test/package.json',
      '/node_modules/@playwright/test/package.json',
    ]);
  });

  it('stops at the root', () => {
    expect(runnerPathsOf('/')).toEqual(['/node_modules/@playwright/test/package.json']);
  });
});
