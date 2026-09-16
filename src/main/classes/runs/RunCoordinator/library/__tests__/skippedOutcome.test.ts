import { describe, expect, it } from 'vitest';
import { skippedOutcome } from '@/main/classes/runs/RunCoordinator/library';

const STEP = {
  caseId: 'tc-1',
  caseTitle: 'Checkout',
  numberInCase: 3,
  action: 'Pay with the saved card',
  expected: 'The order is confirmed',
};

describe('skippedOutcome', () => {
  it('a step the run never walked says so instead of passing', () => {
    const outcome = skippedOutcome({ step: STEP, index: 4, workspaceId: 'w-1' });

    expect(outcome.verdict).toBe('skipped');
    expect(outcome.why).toContain('did not hold up');
  });

  it('carries the step back whole, so the plan and the run line up', () => {
    const outcome = skippedOutcome({ step: STEP, index: 4, workspaceId: 'w-1' });

    expect(outcome).toMatchObject({
      workspaceId: 'w-1',
      caseId: 'tc-1',
      stepNumber: 3,
      index: 4,
      action: 'Pay with the saved card',
      expected: 'The order is confirmed',
    });
  });

  it('has no screenshot, because nothing was looked at', () => {
    const outcome = skippedOutcome({ step: STEP, index: 4, workspaceId: 'w-1' });

    expect(outcome.screenshot).toBeNull();
    expect(outcome.shotFile).toBeNull();
  });
});
