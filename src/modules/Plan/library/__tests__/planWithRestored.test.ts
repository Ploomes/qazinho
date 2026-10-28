import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { planWithRestored } from '@/modules/Plan/library';

function testCase(id: string, title: string): ITestCase {
  return {
    id,
    title,
    priority: 'P2',
    goal: '',
    preconditions: '',
    steps: [],
    lastVerdict: null,
  };
}

describe('planWithRestored', () => {
  it('takes the plan read again whole into an empty plan', () => {
    const restored = [testCase('TC-01', 'Login'), testCase('TC-02', 'Cart')];

    expect(planWithRestored({ plan: [], restored })).toEqual(restored);
  });

  /** O QA começou um plano enquanto o arquivo esperava: nenhum dos dois se perde. */
  it('adds it after the cases written since, renumbering the ones whose id is taken', () => {
    const plan = planWithRestored({
      plan: [testCase('TC-01', 'Written since')],
      restored: [testCase('TC-01', 'Login'), testCase('TC-02', 'Cart')],
    });

    expect(plan.map(({ id, title }) => `${id} ${title}`)).toEqual([
      'TC-01 Written since',
      'TC-03 Login',
      'TC-02 Cart',
    ]);
  });

  it('keeps the ids its runs and bugs point at when nothing took them', () => {
    const plan = planWithRestored({
      plan: [testCase('TC-07', 'Written since')],
      restored: [testCase('TC-01', 'Login')],
    });

    expect(plan.map(({ id }) => id)).toEqual(['TC-07', 'TC-01']);
  });
});
