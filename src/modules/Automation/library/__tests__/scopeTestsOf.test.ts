import { describe, expect, it } from 'vitest';
import { scopeTestsOf } from '@/modules/Automation/library';
import { suiteTest } from './fixtures';

const TESTS = [
  suiteTest({ id: 'a', file: 'tests/hc-1/a.spec.ts' }),
  suiteTest({ id: 'b', file: 'tests/hc-1/old/b.spec.ts' }),
  suiteTest({ id: 'c', file: 'tests/hc-12/c.spec.ts' }),
];

const idsOf = (scope: Parameters<typeof scopeTestsOf>[0]['scope']) =>
  scopeTestsOf({ tests: TESTS, scope }).map(({ id }) => id);

describe('scopeTestsOf', () => {
  it('reaches every test of the suite', () => {
    expect(idsOf({ kind: 'all' })).toEqual(['a', 'b', 'c']);
  });

  it('reaches the tests a folder holds itself, and those of a file', () => {
    expect(idsOf({ kind: 'path', path: 'tests/hc-1' })).toEqual(['a']);
    expect(idsOf({ kind: 'path', path: 'tests/hc-12/c.spec.ts' })).toEqual(['c']);
  });

  it('reaches the tests asked for by their id, and none it does not know', () => {
    expect(idsOf({ kind: 'tests', testIds: ['c', 'zz'] })).toEqual(['c']);
  });
});
