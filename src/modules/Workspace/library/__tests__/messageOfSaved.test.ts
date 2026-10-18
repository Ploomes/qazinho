import { describe, expect, it } from 'vitest';
import { messageOfSaved } from '@/modules/Workspace/library';

const VERDICT = {
  id: 'm-3',
  kind: 'verdict' as const,
  at: '09:42',
  verdict: 'failed' as const,
  expected: 'The coupon is refused',
  got: 'Coupon applied',
};

describe('messageOfSaved', () => {
  it('reads a verdict saved today as it was', () => {
    const today = { ...VERDICT, runId: 'r-01', stepNumber: 3, action: 'Apply EXPIRED10' };

    expect(messageOfSaved(today)).toEqual(today);
  });

  it('reads a verdict saved before the chat kept runs together as belonging to none', () => {
    expect(
      messageOfSaved({ ...VERDICT, stepNumber: 3, action: 'Apply EXPIRED10' }),
    ).toMatchObject({ runId: null });
    expect(
      messageOfSaved({ id: 'm-4', kind: 'error', at: '09:42', text: 'x', fix: null }),
    ).toMatchObject({ runId: null });
  });

  /** A verdict used to be one English line; the chat now writes it in the QA's language. */
  it('reads the step and the action out of the line an older verdict kept', () => {
    expect(
      messageOfSaved({ ...VERDICT, text: 'Step 3 failed · Apply EXPIRED10 · then pay' }),
    ).toEqual({
      ...VERDICT,
      runId: null,
      stepNumber: 3,
      action: 'Apply EXPIRED10 · then pay',
    });
  });

  it('keeps a line it cannot read as the action, with no step number', () => {
    expect(messageOfSaved({ ...VERDICT, text: 'Something odd' })).toMatchObject({
      stepNumber: 0,
      action: 'Something odd',
    });
  });

  it('reads a run saved before runs said how they ended as one that finished', () => {
    expect(
      messageOfSaved({
        id: 'm-1',
        kind: 'run',
        at: '09:42',
        runId: 'r-01',
        passed: 1,
        failed: 0,
      }),
    ).toMatchObject({ kind: 'run', endedBy: 'finished' });
  });

  it('drops the action logs an older chat still carries', () => {
    expect(messageOfSaved({ id: 'm-2', kind: 'action', at: '09:42' })).toBeNull();
  });

  it('leaves every other message alone', () => {
    const user = { id: 'm-1', kind: 'user' as const, at: '09:41', text: 'hi' };

    expect(messageOfSaved(user)).toBe(user);
  });
});
