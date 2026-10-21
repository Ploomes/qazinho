import { describe, expect, it } from 'vitest';
import { appearancesOf, catchBug } from '@/modules/Bug/library';
import { failedAgain, secondRun } from './fixtures';

describe('appearancesOf', () => {
  it('reads a bug caught once as the one time it was caught', () => {
    const [bug] = secondRun().bugs;

    expect(bug === undefined ? [] : appearancesOf(bug)).toEqual([
      {
        runId: 'r-01',
        runWhen: '09:41',
        caseId: 'TC-02',
        stepNumber: 2,
        at: 1_760_000_010_000,
      },
    ]);
  });

  it('adds each time it was caught again, in the order they came', () => {
    const workspace = secondRun();
    const [bug] = catchBug({
      workspace,
      outcome: failedAgain(workspace),
      outcomes: [],
      isIncidental: false,
    }).bugs;

    expect(bug === undefined ? [] : appearancesOf(bug).map(({ runId }) => runId)).toEqual(
      ['r-01', 'r-02'],
    );
  });
});
