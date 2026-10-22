import type { IBug } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { pasteShotOf } from '@/modules/Bug/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const BUG: IBug = walkRun({ verdicts: ['passed', 'failed'] }).bugs[0]!;

describe('pasteShotOf', () => {
  it('pastes the screen that broke', () => {
    expect(pasteShotOf(BUG)?.isBad).toBe(true);
  });

  it('pastes the screen the latest run caught, once one caught it again', () => {
    const shot = { isBad: true, src: null, file: '/tmp/r-02.jpg' };

    expect(
      pasteShotOf({
        ...BUG,
        sightings: [
          {
            runId: 'r-02',
            runWhen: '10:05',
            caseId: 'TC-01',
            stepNumber: 2,
            at: 1,
            shot,
          },
        ],
      }),
    ).toBe(shot);
  });

  it('pastes nothing it can no longer read', () => {
    expect(
      pasteShotOf({ ...BUG, shots: [{ isBad: true, src: null, file: null }] }),
    ).toBeNull();
  });
});
