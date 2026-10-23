import type { IBug } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { unreviewedOf } from '@/modules/Bug/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const BASE: IBug = walkRun({ verdicts: ['passed', 'failed'] }).bugs[0]!;
const shot = { isBad: true, src: null, file: '/r.jpg' };
const seen = (runId: string) => ({
  runId,
  runWhen: '10:00',
  caseId: 'TC-01',
  stepNumber: 2,
  at: 1,
  shot,
});
const FILED = {
  tracker: 'jira' as const,
  key: 'SHOP-57',
  url: 'https://j/SHOP-57',
  at: '',
};
const BUG: IBug = {
  ...BASE,
  filed: FILED,
  reviewedRuns: ['r-01', 'r-02'],
  sightings: [seen('r-02'), seen('r-03'), seen('r-04')],
};

describe('unreviewedOf', () => {
  it('names the runs that caught a filed bug again and nobody weighed yet', () => {
    expect(unreviewedOf(BUG).map(({ runId }) => runId)).toEqual(['r-03', 'r-04']);
  });

  it('names none for a bug never filed, or while a look is under way', () => {
    expect(unreviewedOf({ ...BUG, filed: null })).toEqual([]);
    expect(
      unreviewedOf({
        ...BUG,
        review: {
          runs: ['r-03'],
          state: 'reviewing',
          verdict: null,
          reason: '',
          comment: '',
          url: null,
          error: '',
          at: '',
        },
      }),
    ).toEqual([]);
  });

  it('weighs nothing for a bug the QA said is none', () => {
    expect(unreviewedOf({ ...BUG, isDismissed: true })).toEqual([]);
  });
});
