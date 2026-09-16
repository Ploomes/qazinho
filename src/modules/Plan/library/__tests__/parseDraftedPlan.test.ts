import { describe, expect, it } from 'vitest';
import { parseDraftedPlan } from '@/modules/Plan/library';

const ANSWER = JSON.stringify({
  summary: 'Four cases over the checkout.',
  cases: [
    {
      title: 'Checkout with a test card',
      priority: 'P1',
      goal: 'A card order goes through.',
      preconditions: 'One product in the cart.',
      steps: [{ action: 'Pay with the test card', expected: 'A confirmation appears' }],
    },
  ],
});

describe('parseDraftedPlan', () => {
  it('numbers the cases the way the plan editor shows them', () => {
    const drafted = parseDraftedPlan(ANSWER);

    expect(drafted?.plan[0]?.id).toBe('TC-01');
    expect(drafted?.summary).toBe('Four cases over the checkout.');
  });

  it('refuses an answer that is not json at all', () => {
    expect(parseDraftedPlan('I could not do that.')).toBeNull();
  });

  it('refuses a plan with no case worth running', () => {
    expect(parseDraftedPlan(JSON.stringify({ summary: 'none', cases: [] }))).toBeNull();
  });

  it('drops a case whose steps say nothing', () => {
    const half = JSON.stringify({
      summary: 'one good, one empty',
      cases: [
        { title: 'Empty', priority: 'P1', goal: '', preconditions: '', steps: [] },
        {
          title: 'Real',
          priority: 'P1',
          goal: '',
          preconditions: '',
          steps: [{ action: 'Open it', expected: 'It opens' }],
        },
      ],
    });

    const drafted = parseDraftedPlan(half);

    expect(drafted?.plan).toHaveLength(1);
    expect(drafted?.plan[0]?.title).toBe('Real');
  });

  it('falls back to P2 when the agent invents a priority', () => {
    const odd = JSON.stringify({
      summary: 'x',
      cases: [
        {
          title: 'Odd',
          priority: 'urgent',
          goal: '',
          preconditions: '',
          steps: [{ action: 'a', expected: 'b' }],
        },
      ],
    });

    expect(parseDraftedPlan(odd)?.plan[0]?.priority).toBe('P2');
  });
});
