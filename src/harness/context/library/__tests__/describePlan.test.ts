import { describe, expect, it } from 'vitest';
import { describePlan } from '@/harness/context/library';

describe('describePlan', () => {
  it('groups the steps under their case, numbered as the QA sees them', () => {
    expect(
      describePlan([
        {
          caseId: 'TC-01',
          caseTitle: 'Sign in',
          numberInCase: 1,
          action: 'Open',
          expected: 'Form',
        },
        {
          caseId: 'TC-01',
          caseTitle: 'Sign in',
          numberInCase: 2,
          action: 'Submit',
          expected: 'Home',
        },
        {
          caseId: 'TC-02',
          caseTitle: 'Cart',
          numberInCase: 1,
          action: 'Add',
          expected: 'Badge 1',
        },
      ]),
    ).toEqual([
      'The plan the workspace holds right now:',
      'TC-01 · Sign in',
      '  1. Open → Form',
      '  2. Submit → Home',
      'TC-02 · Cart',
      '  1. Add → Badge 1',
    ]);
  });

  it('says there is no plan instead of an empty list', () => {
    expect(describePlan([])).toEqual(['The workspace has no plan yet.']);
  });
});
