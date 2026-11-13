import { describe, expect, it } from 'vitest';
import { planExtrasOfYaml } from '@/modules/Plan/library';

describe('planExtrasOfYaml', () => {
  it('reads the strategy and the doubts a plan keeps beside its cases', () => {
    expect(
      planExtrasOfYaml(
        [
          'cases: []',
          'strategy:',
          '  covers: Coupons in the checkout',
          '  leavesOut: The phone app',
          'doubts:',
          '  - id: D1',
          '    question: Does an expired coupon vanish?',
          '    sent: { url: "https://shop.atlassian.net/browse/SHOP-878", at: "2026-11-12" }',
          '    answer: { text: An error, by: Ana, at: "2026-11-13" }',
          '  - id: D2',
          '    question: Is the limit per person?',
        ].join('\n'),
      ),
    ).toEqual({
      strategy: {
        covers: 'Coupons in the checkout',
        leavesOut: 'The phone app',
        where: '',
        data: '',
        risks: '',
      },
      doubts: [
        {
          id: 'D1',
          question: 'Does an expired coupon vanish?',
          sent: { url: 'https://shop.atlassian.net/browse/SHOP-878', at: '2026-11-12' },
          answer: { text: 'An error', by: 'Ana', at: '2026-11-13' },
        },
        { id: 'D2', question: 'Is the limit per person?', sent: null, answer: null },
      ],
    });
  });

  it('reads a plan with neither, a doubt with no question, or nonsense as none', () => {
    expect(planExtrasOfYaml('cases: []')).toEqual({ strategy: null, doubts: [] });
    expect(planExtrasOfYaml('doubts:\n  - id: D1\n')).toEqual({
      strategy: null,
      doubts: [],
    });
    expect(planExtrasOfYaml('{not: yaml')).toEqual({ strategy: null, doubts: [] });
  });
});
