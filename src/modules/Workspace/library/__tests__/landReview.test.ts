import type { IBugReview } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { landReview } from '@/modules/Workspace/library';
import { walkRun } from './fixtures';

const REVIEW: IBugReview = {
  runs: ['r-02'],
  state: 'reviewing',
  verdict: null,
  reason: '',
  comment: '',
  url: null,
  error: '',
  at: '2026-10-22T12:00:00.000Z',
};

describe('landReview', () => {
  it('lands the look on its bug, and counts its runs as told only once the agent weighed them', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'] });
    const [bug] = workspace.bugs;
    const reviewing = landReview({ workspace, bugId: bug!.id, review: REVIEW });

    expect(reviewing.bugs[0]?.review).toEqual(REVIEW);
    expect(reviewing.bugs[0]?.reviewedRuns).toEqual([]);

    const weighed = landReview({
      workspace: reviewing,
      bugId: bug!.id,
      review: { ...REVIEW, state: 'nothing-new', verdict: 'nothing-new' },
    });

    expect(weighed.bugs[0]?.reviewedRuns).toEqual(['r-02']);
  });

  it('does NOT count the runs of a look that failed, so the next one tries again', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'] });
    const [bug] = workspace.bugs;

    expect(
      landReview({ workspace, bugId: bug!.id, review: { ...REVIEW, state: 'failed' } })
        .bugs[0]?.reviewedRuns,
    ).toEqual([]);
  });

  it('changes nothing for a bug that is no longer there', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'] });

    expect(landReview({ workspace, bugId: 'BUG-99', review: REVIEW })).toBe(workspace);
  });
});
