import type { IBug } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { openBugFor } from '@/modules/Bug/library';
import { secondRun } from './fixtures';

function bugs(): IBug[] {
  const [first] = secondRun().bugs;

  return first === undefined
    ? []
    : [
        first,
        {
          ...first,
          id: 'BUG-02',
          title: 'The yearly price differs from the mockup',
          caseId: 'TC-01',
          stepNumber: 1,
          isIncidental: true,
        },
      ];
}

const ASKED = {
  sameAs: undefined,
  caseId: 'TC-01',
  stepNumber: 3,
  title: 'Something else broke',
  isIncidental: false,
};

describe('openBugFor', () => {
  it('takes the bug the agent named as the one it saw again', () => {
    expect(openBugFor({ bugs: bugs(), ...ASKED, sameAs: 'BUG-02' })?.id).toBe('BUG-02');
  });

  it('takes the bug a plan step failed for before when the same step fails again', () => {
    expect(
      openBugFor({ bugs: bugs(), ...ASKED, caseId: 'TC-02', stepNumber: 2 })?.id,
    ).toBe('BUG-01');
  });

  it('does NOT tie a bug seen on the side to the step it was seen beside', () => {
    expect(
      openBugFor({
        bugs: bugs(),
        ...ASKED,
        caseId: 'TC-02',
        stepNumber: 2,
        isIncidental: true,
      }),
    ).toBeNull();
  });

  it('takes a bug with the same title, whatever its case, capitals or spaces', () => {
    expect(
      openBugFor({
        bugs: bugs(),
        ...ASKED,
        title: '  the yearly price   differs from the MOCKUP ',
        isIncidental: true,
      })?.id,
    ).toBe('BUG-02');
  });

  it('does NOT match a step that failed with no title of its own', () => {
    expect(openBugFor({ bugs: bugs(), ...ASKED, title: '' })).toBeNull();
  });

  it('says a bug is new when nothing open is it', () => {
    expect(openBugFor({ bugs: bugs(), ...ASKED })).toBeNull();
  });
});
