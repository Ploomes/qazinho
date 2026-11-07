import type { ITestCase } from '@/modules/Plan/types';
import type { IDraftedCase } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { planWithCases } from '@/modules/Plan/library';

const CARD: IDraftedCase = {
  title: 'Checkout with a test card',
  priority: 'P1',
  goal: 'A card order goes through.',
  preconditions: 'One product in the cart.',
  steps: [{ action: 'Pay with the test card', expected: 'A confirmation appears' }],
};

const kept = (id: string, title: string): ITestCase => ({
  ...CARD,
  id,
  title,
  lastVerdict: 'failed',
});

const PLAN = [kept('TC-01', 'Login'), kept('TC-02', 'Search')];

describe('planWithCases', () => {
  it('replaces a case in its place and adds a new one at the end', () => {
    const plan = planWithCases({
      plan: PLAN,
      cases: [
        { ...CARD, title: 'Coupon' },
        { ...CARD, id: 'TC-01', title: 'Login with Google' },
      ],
      used: ['TC-01', 'TC-02'],
    });

    expect(plan?.map(({ id, title }) => `${id} ${title}`)).toEqual([
      'TC-01 Login with Google',
      'TC-02 Search',
      'TC-03 Coupon',
    ]);
  });

  it('does NOT reuse the id of a case deleted before', () => {
    const plan = planWithCases({
      plan: PLAN,
      cases: [{ ...CARD, title: 'Coupon' }],
      used: ['TC-01', 'TC-02', 'TC-03'],
    });

    expect(plan?.at(-1)?.id).toBe('TC-04');
  });

  it('keeps the plan as it was when the cases add nothing readable', () => {
    expect(
      planWithCases({ plan: PLAN, cases: [{ ...CARD, title: '  ' }], used: [] })?.map(
        ({ id }) => id,
      ),
    ).toEqual(['TC-01', 'TC-02']);
  });
});
