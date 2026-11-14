import { describe, expect, it } from 'vitest';
import { testCasesOf } from '@/modules/Pro/library';
import { CASES } from '@/modules/Workspace/library/__tests__/fixtures';
import { caseOf } from './mergeFixtures';

describe('testCasesOf', () => {
  it('keeps how a case’s last run went here, by its id', () => {
    const plan = testCasesOf({
      cases: [caseOf({ id: 'TC-01', title: 'Renamed' }), caseOf({ id: 'TC-09' })],
      local: [{ ...CASES[0]!, lastVerdict: 'passed' }],
    });

    expect(
      plan.map(({ id, title, lastVerdict }) => ({ id, title, lastVerdict })),
    ).toEqual([
      { id: 'TC-01', title: 'Renamed', lastVerdict: 'passed' },
      { id: 'TC-09', title: 'Case TC-09', lastVerdict: null },
    ]);
  });

  it('brings a case the org walks by hand as one here too', () => {
    const [manual, plain] = testCasesOf({
      cases: [{ ...caseOf({ id: 'TC-01' }), isManual: true }, caseOf({ id: 'TC-02' })],
      local: [],
    });

    expect(manual?.isManual).toBe(true);
    expect(plain).not.toHaveProperty('isManual');
  });
});
