import { describe, expect, it } from 'vitest';
import { reviewSightingsOf } from '@/modules/Bug/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });
const BUG = WORKSPACE.bugs[0]!;

describe('reviewSightingsOf', () => {
  it('tells each time with its step, its agent’s note, its screen and the requests that failed', () => {
    expect(
      reviewSightingsOf({
        workspace: WORKSPACE,
        bug: BUG,
        sightings: [
          {
            runId: 'r-01',
            runWhen: '09:41',
            caseId: 'TC-01',
            stepNumber: 2,
            at: 1,
            shot: { isBad: true, src: null, file: '/data/runs/w1/r-01/step-2.jpg' },
          },
        ],
        failed: {
          'r-01': [
            {
              id: 1,
              method: 'POST',
              url: 'https://shop.test/api/search',
              type: 'fetch',
              status: 500,
              failure: null,
              startedAt: 1,
              durationMs: 10,
              size: 1,
            },
          ],
        },
      }),
    ).toEqual([
      {
        runId: 'r-01',
        runWhen: '09:41',
        caseId: 'TC-01',
        stepNumber: 2,
        action: 'Search for a product',
        note: 'The page did not do it.',
        target: BUG.target,
        shot: '/data/runs/w1/r-01/step-2.jpg',
        requests: ['POST https://shop.test/api/search → 500'],
      },
    ]);
  });

  it('falls back to the step that broke when the run is gone', () => {
    const [seen] = reviewSightingsOf({
      workspace: { ...WORKSPACE, runs: [] },
      bug: BUG,
      sightings: [
        {
          runId: 'r-09',
          runWhen: '',
          caseId: 'TC-01',
          stepNumber: 2,
          at: null,
          shot: { isBad: true, src: null, file: null },
        },
      ],
      failed: {},
    });

    expect(seen).toMatchObject({
      action: 'Search for a product',
      note: '',
      shot: null,
      requests: [],
    });
  });
});
