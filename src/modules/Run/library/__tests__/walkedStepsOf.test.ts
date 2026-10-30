import type { ITestCase } from '@/modules/Plan';
import { describe, expect, it } from 'vitest';
import { walkedStepsOf } from '@/modules/Run/library';

const CASE: ITestCase = {
  id: 'TC-01',
  title: 'Checkout with a test card',
  priority: 'P1',
  goal: 'A card order goes through.',
  preconditions: 'One product in the cart.',
  steps: [
    { action: 'Add the product to the cart', expected: 'The cart badge reads 1' },
    { action: 'Pay with the test card', expected: 'A confirmation' },
  ],
  lastVerdict: null,
};
const PLAN: ITestCase[] = [
  CASE,
  {
    ...CASE,
    id: 'TC-02',
    title: 'An invalid coupon is refused',
    steps: [CASE.steps[0]!],
  },
];

describe('walkedStepsOf', () => {
  it('walks every step of the plan when no case was chosen', () => {
    expect(walkedStepsOf({ plan: PLAN, caseIds: undefined })).toHaveLength(3);
  });

  it('walks only the steps of the cases the QA chose to run', () => {
    expect(
      walkedStepsOf({ plan: PLAN, caseIds: ['TC-02'] }).map(({ caseId }) => caseId),
    ).toEqual(['TC-02']);
  });

  it('walks nothing for a case the plan no longer has', () => {
    expect(walkedStepsOf({ plan: PLAN, caseIds: ['TC-99'] })).toEqual([]);
  });
});
