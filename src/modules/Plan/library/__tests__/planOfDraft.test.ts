import type { IDraftedCase } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { planOfDraft } from '@/modules/Plan/library';

const CARD: IDraftedCase = {
  title: 'Checkout with a test card',
  priority: 'P1',
  goal: 'A card order goes through.',
  preconditions: 'One product in the cart.',
  steps: [{ action: 'Pay with the test card', expected: 'A confirmation appears' }],
};

describe('planOfDraft', () => {
  it('numbers the cases the way the plan editor shows them', () => {
    const plan = planOfDraft([CARD, { ...CARD, title: 'Second' }]);

    expect(plan?.map(({ id }) => id)).toEqual(['TC-01', 'TC-02']);
    expect(plan?.[0]?.lastVerdict).toBeNull();
  });

  it('refuses a plan with no case worth running', () => {
    expect(planOfDraft([])).toBeNull();
  });

  it('drops a case whose steps say nothing, or that has no title', () => {
    const plan = planOfDraft([
      { ...CARD, title: 'Empty', steps: [{ action: ' ', expected: 'x' }] },
      { ...CARD, title: '  ' },
      { ...CARD, title: 'Real' },
    ]);

    expect(plan?.map(({ title }) => title)).toEqual(['Real']);
  });

  it('trims what the agent wrote', () => {
    const plan = planOfDraft([{ ...CARD, title: '  Padded  ', goal: ' g ' }]);

    expect(plan?.[0]).toMatchObject({ title: 'Padded', goal: 'g' });
  });
});
