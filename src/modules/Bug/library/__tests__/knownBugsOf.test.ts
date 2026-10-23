import { describe, expect, it } from 'vitest';
import { knownBugsOf } from '@/modules/Bug/library';
import { secondRun } from './fixtures';

describe('knownBugsOf', () => {
  it('tells a run each bug open by its id, title and where it was caught', () => {
    expect(knownBugsOf(secondRun().bugs)).toEqual([
      {
        id: 'BUG-01',
        title: 'Nothing happens on submit',
        caseId: 'TC-02',
        stepNumber: 2,
        isIncidental: false,
      },
    ]);
  });

  it('tells nothing when no bug is open', () => {
    expect(knownBugsOf([])).toEqual([]);
  });

  /** Told of a false positive, every run's agent named it seen again. */
  it('does NOT tell a run of a bug the QA said is none', () => {
    expect(
      knownBugsOf(secondRun().bugs.map((bug) => ({ ...bug, isDismissed: true }))),
    ).toEqual([]);
  });
});
