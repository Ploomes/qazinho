import { describe, expect, it } from 'vitest';
import { UNWALKED } from '@/main/classes/runs/RunCoordinator/constants';
import { unwalkedOutcome } from '@/main/classes/runs/RunCoordinator/library';

const STEP = {
  caseId: 'tc-1',
  caseTitle: 'Checkout',
  casePriority: 'P1',
  caseGoal: '',
  casePreconditions: '',
  numberInCase: 3,
  action: 'Pay with the saved card',
  expected: 'The order is confirmed',
};

describe('unwalkedOutcome', () => {
  it('a step the run never walked says so instead of passing', () => {
    const outcome = unwalkedOutcome({
      step: STEP,
      index: 4,
      workspaceId: 'w-1',
      verdict: 'skipped',
      why: UNWALKED.skipped,
    });

    expect(outcome.verdict).toBe('skipped');
    expect(outcome.why).toContain('did not hold up');
  });

  it('a step the agent never reported is blocked, not passed', () => {
    expect(
      unwalkedOutcome({
        step: STEP,
        index: 4,
        workspaceId: 'w-1',
        verdict: 'blocked',
        why: UNWALKED.unreported,
      }).verdict,
    ).toBe('blocked');
  });

  it('carries the step back whole, with no screenshot, because nothing was looked at', () => {
    expect(
      unwalkedOutcome({
        step: STEP,
        index: 4,
        workspaceId: 'w-1',
        verdict: 'skipped',
        why: '',
      }),
    ).toMatchObject({
      workspaceId: 'w-1',
      caseId: 'tc-1',
      stepNumber: 3,
      index: 4,
      action: 'Pay with the saved card',
      expected: 'The order is confirmed',
      screenshot: null,
      shotFile: null,
    });
  });
});
