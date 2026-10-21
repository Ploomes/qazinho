import type { IWorkspace } from '@/modules/Workspace/types';
import { describe, expect, it } from 'vitest';
import { describeRun } from '@/modules/Assistant/library';
import { CHECKOUT, LOGIN } from './fixtures';

const NOTED: IWorkspace = {
  ...CHECKOUT,
  chat: [
    {
      id: 'm-1',
      kind: 'note',
      at: '09:41',
      runId: 'r-01',
      who: 'Claude Code',
      text: 'Closed a banner.',
    },
  ],
};

describe('describeRun', () => {
  it('tells the latest run step by step, with the notes its agent left and the bugs it found', () => {
    const { text, isError } = describeRun({ workspace: NOTED, runId: null });

    expect(isError).toBe(false);
    expect(text).toContain('Run r-01 of w1 "Checkout regression"');
    expect(text).toContain(
      '  step 2 failed: Search for a product (The page did not do it.)',
    );
    expect(text).toContain('note: Closed a banner.');
    expect(text).toContain('Bugs it found: BUG-01 "Nothing happens on submit" (high).');
  });

  it('finds a run by its id in any case', () => {
    expect(describeRun({ workspace: NOTED, runId: 'R-01' }).text).toContain('Run r-01');
  });

  it('does NOT make up a run: it names the runs there are', () => {
    expect(describeRun({ workspace: NOTED, runId: 'r-09' })).toEqual({
      text: 'w1 has no run "r-09". Its runs are r-01.',
      isError: true,
    });
    expect(describeRun({ workspace: LOGIN, runId: null })).toEqual({
      text: 'w2 "Login" has no runs yet.',
      isError: false,
    });
  });

  it('tells how far a run going on has walked', () => {
    const live = CHECKOUT.live ?? null;

    expect(
      describeRun({
        workspace: {
          ...CHECKOUT,
          live:
            live === null
              ? null
              : { ...live, id: 'r-02', isDone: false, isRunning: false },
        },
        runId: null,
      }).text,
    ).toBe('r-02 of w1 is still paused: 6 steps walked so far, 5 passed, 1 failed.');
  });
});
