import { describe, expect, it } from 'vitest';
import { sightingOf } from '@/modules/Bug/library';
import { failedAgain, secondRun } from './fixtures';

describe('sightingOf', () => {
  it('places the bug in the run walking now, with the screen that showed it', () => {
    const workspace = secondRun();

    expect(sightingOf({ workspace, outcome: failedAgain(workspace) })).toEqual({
      runId: 'r-02',
      runWhen: '10:05',
      caseId: 'TC-02',
      stepNumber: 2,
      at: 1_760_000_100_000,
      shot: {
        isBad: true,
        src: 'data:image/jpeg;base64,again',
        file: '/tmp/qazinho/r-02/step-5.jpg',
      },
    });
  });
});
