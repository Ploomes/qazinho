import type { IBug } from '@/modules/Bug';
import type { IRun } from '@/modules/Run';
import { describe, expect, it } from 'vitest';
import { caseIdsUsed } from '@/modules/Plan/library';
import { CASES } from '@/modules/Workspace/library/__tests__/fixtures';

describe('caseIdsUsed', () => {
  it('names the cases of the plan, of every run and of every bug', () => {
    expect(
      caseIdsUsed({
        plan: CASES,
        runs: [{ cases: [{ id: 'TC-07' }] } as IRun],
        bugs: [{ caseId: 'TC-09' } as IBug],
      }),
    ).toEqual(['TC-01', 'TC-02', 'TC-07', 'TC-09']);
  });

  it('names nothing for an empty workspace', () => {
    expect(caseIdsUsed({ plan: [], runs: [], bugs: [] })).toEqual([]);
  });
});
