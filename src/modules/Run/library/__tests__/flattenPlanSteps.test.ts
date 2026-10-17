import type { ITestCase } from '@/modules/Plan';
import { describe, expect, it } from 'vitest';
import { flattenPlanSteps } from '@/modules/Run/library';

const CASE: ITestCase = {
  id: 'TC-01',
  title: 'Checkout with a test card',
  priority: 'P1',
  goal: 'A card order goes through.',
  preconditions: 'One product in the cart.',
  steps: [
    { action: 'Add the product to the cart', expected: 'The cart badge reads 1' },
    { action: 'Pay with the test card', expected: 'A confirmation with an order number' },
  ],
  lastVerdict: null,
};

describe('flattenPlanSteps', () => {
  it('walks the cases in order and numbers each step inside its own case', () => {
    const second: ITestCase = {
      ...CASE,
      id: 'TC-02',
      title: 'An invalid coupon is refused',
    };

    const steps = flattenPlanSteps([CASE, second]);

    expect(steps).toHaveLength(4);
    expect(steps.map((step) => step.caseId)).toEqual([
      'TC-01',
      'TC-01',
      'TC-02',
      'TC-02',
    ]);
    expect(steps.map((step) => step.numberInCase)).toEqual([1, 2, 1, 2]);
  });

  it('carries the case title along, because the run report groups by case', () => {
    const [first] = flattenPlanSteps([CASE]);

    expect(first?.caseTitle).toBe('Checkout with a test card');
    expect(first?.expected).toBe('The cart badge reads 1');
  });

  it('has nothing to walk when the plan is empty', () => {
    expect(flattenPlanSteps([])).toEqual([]);
  });

  it('skips a case that has no steps yet', () => {
    expect(flattenPlanSteps([{ ...CASE, steps: [] }])).toEqual([]);
  });
});
