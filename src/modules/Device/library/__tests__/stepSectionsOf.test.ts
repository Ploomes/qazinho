import { describe, expect, it } from 'vitest';
import { stepSectionsOf } from '@/modules/Device/library/stepSectionsOf';

const step = (props: { number: number; caseId?: string; caseTitle?: string }) => ({
  action: `Step ${String(props.number)}`,
  verdict: 'passed' as const,
  ...props,
});

describe('stepSectionsOf', () => {
  /** "Abrir… Finalizar compra" três vezes igual não dizia de qual caso cada um era. */
  it('gathers the steps of a case under its title', () => {
    const sections = stepSectionsOf([
      step({ number: 1, caseId: 'TC-01', caseTitle: 'Empty cart' }),
      step({ number: 2, caseId: 'TC-01', caseTitle: 'Empty cart' }),
      step({ number: 3, caseId: 'TC-02', caseTitle: 'Coupon' }),
    ]);

    expect(sections.map(({ key, title, rows }) => [key, title, rows.length])).toEqual([
      ['TC-01', 'Empty cart', 2],
      ['TC-02', 'Coupon', 1],
    ]);
  });

  it('keeps steps with no case in one group with no title', () => {
    expect(stepSectionsOf([step({ number: 1 }), step({ number: 2 })])).toMatchObject([
      { key: '', title: '' },
    ]);
  });

  it('has no group for no steps', () => {
    expect(stepSectionsOf([])).toEqual([]);
  });
});
