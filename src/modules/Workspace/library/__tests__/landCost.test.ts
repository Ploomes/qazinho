import { describe, expect, it } from 'vitest';
import { endRun, landCost } from '@/modules/Workspace/library';
import { makeWorkspace, walkRun } from './fixtures';

describe('landCost', () => {
  it('adds up what each case cost while the run goes', () => {
    const once = landCost({
      workspace: walkRun({ verdicts: ['passed'] }),
      costUsd: 0.04,
    });
    const twice = landCost({ workspace: once, costUsd: 0.06 });

    expect(once.live?.costUsd).toBe(0.04);
    expect(twice.live?.costUsd).toBeCloseTo(0.1);
  });

  it('keeps the total in the run it ends as', () => {
    const paid = landCost({
      workspace: walkRun({ verdicts: ['passed'] }),
      costUsd: 0.25,
    });

    expect(
      endRun({ workspace: paid, at: '09:42', endedBy: 'finished' }).runs[0]?.costUsd,
    ).toBe(0.25);
  });

  it('does NOT charge a workspace with no run going', () => {
    const idle = makeWorkspace();

    expect(landCost({ workspace: idle, costUsd: 1 })).toBe(idle);
  });
});
