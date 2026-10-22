import { describe, expect, it } from 'vitest';
import { planCaseOf } from '@/modules/Automation/library';

describe('planCaseOf', () => {
  it('hands the agent what the case says and the workspace it is in, and nothing of its runs', () => {
    expect(
      planCaseOf({
        workspace: 'Checkout regression',
        testCase: {
          id: 'TC-03',
          title: 'Cart survives a reload',
          priority: 'P1',
          goal: 'An item stays in the cart.',
          preconditions: 'One product in the cart.',
          steps: [
            { action: 'Reload the page.', expected: 'The product is still there.' },
          ],
          lastVerdict: 'failed',
        },
      }),
    ).toEqual({
      workspace: 'Checkout regression',
      id: 'TC-03',
      title: 'Cart survives a reload',
      goal: 'An item stays in the cart.',
      preconditions: 'One product in the cart.',
      steps: [{ action: 'Reload the page.', expected: 'The product is still there.' }],
    });
  });
});
