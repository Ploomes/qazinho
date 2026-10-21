import { describe, expect, it } from 'vitest';
import { catchBug } from '@/modules/Bug/library';
import { failedAgain, secondRun } from './fixtures';

describe('catchBug', () => {
  /** r-02 filed the same broken submit as BUG-03, next to the BUG-01 r-01 had filed. */
  it('lands a step that fails again on its bug, seen in two runs, instead of a new one', () => {
    const workspace = secondRun();
    const caught = catchBug({
      workspace,
      outcome: failedAgain(workspace),
      outcomes: [],
      isIncidental: false,
    });

    expect(caught).toMatchObject({ bugId: 'BUG-01', how: 'again' });
    expect(caught.bugs).toHaveLength(1);
    expect(caught.bugs[0]?.seenRuns).toBe(2);
  });

  it('opens a new bug for one nothing open is', () => {
    const workspace = secondRun();
    const caught = catchBug({
      workspace,
      outcome: { ...failedAgain(workspace), caseId: 'TC-01', stepNumber: 1 },
      outcomes: [],
      isIncidental: true,
    });

    expect(caught).toMatchObject({ bugId: 'BUG-02', how: 'new' });
    expect(caught.bugs.at(-1)?.isIncidental).toBe(true);
  });

  it('does NOT count the same run twice for one bug', () => {
    const workspace = secondRun();
    const once = catchBug({
      workspace,
      outcome: failedAgain(workspace),
      outcomes: [],
      isIncidental: false,
    });
    const twice = catchBug({
      workspace: { ...workspace, bugs: once.bugs },
      outcome: { ...failedAgain(workspace), sameAs: 'BUG-01' },
      outcomes: [],
      isIncidental: true,
    });

    expect(twice.how).toBe('repeat');
    expect(twice.bugs).toBe(once.bugs);
  });
});
