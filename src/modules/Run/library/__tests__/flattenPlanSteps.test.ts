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

  it('carries what the case needs before it starts, so the agent can set it up', () => {
    const [first, second] = flattenPlanSteps([CASE]);

    expect(first).toMatchObject({
      casePriority: 'P1',
      caseGoal: 'A card order goes through.',
      casePreconditions: 'One product in the cart.',
    });
    expect(second?.casePreconditions).toBe('One product in the cart.');
  });

  it('carries the Figma node a step’s screen should match, and nothing for a step with none', () => {
    const [first, second] = flattenPlanSteps([
      {
        ...CASE,
        steps: [{ ...CASE.steps[0]!, frame: '12:345' }, CASE.steps[1]!],
      },
    ]);

    expect(first?.frame).toBe('12:345');
    expect(second).not.toHaveProperty('frame');
  });

  it('has nothing to walk when the plan is empty', () => {
    expect(flattenPlanSteps([])).toEqual([]);
  });

  /** A case added by hand starts with a blank step; a run sent it to the agent as "1. ". */
  it('skips a step with nothing to do yet, and keeps the number the plan shows', () => {
    const steps = flattenPlanSteps([
      {
        ...CASE,
        steps: [
          { action: '  ', expected: '' },
          { action: 'Pay with the test card', expected: 'A confirmation' },
        ],
      },
    ]);

    expect(steps.map(({ action, numberInCase }) => [action, numberInCase])).toEqual([
      ['Pay with the test card', 2],
    ]);
  });

  it('skips a case that has no steps yet', () => {
    expect(flattenPlanSteps([{ ...CASE, steps: [] }])).toEqual([]);
  });
});
