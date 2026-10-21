import { describe, expect, it } from 'vitest';
import { catchBug, isSeenIn } from '@/modules/Bug/library';
import { failedAgain, secondRun } from './fixtures';

describe('isSeenIn', () => {
  it('finds a bug in the run that first caught it', () => {
    const [bug] = secondRun().bugs;

    expect(bug !== undefined && isSeenIn({ bug, runId: 'r-01' })).toBe(true);
  });

  it('finds it in a run that caught it again', () => {
    const workspace = secondRun();
    const [bug] = catchBug({
      workspace,
      outcome: failedAgain(workspace),
      outcomes: [],
      isIncidental: false,
    }).bugs;

    expect(bug !== undefined && isSeenIn({ bug, runId: 'r-02' })).toBe(true);
  });

  it('does NOT find it in a run that never caught it', () => {
    const [bug] = secondRun().bugs;

    expect(bug !== undefined && isSeenIn({ bug, runId: 'r-02' })).toBe(false);
  });
});
