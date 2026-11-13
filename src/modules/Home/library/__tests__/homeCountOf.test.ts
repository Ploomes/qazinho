import { describe, expect, it } from 'vitest';
import { homeCountOf } from '@/modules/Home/library';

const PLAN = { workspaceId: 'w', plan: 'Cupom', project: 'Loja' };

describe('homeCountOf', () => {
  it('counts what waits on a move of the QA: a question, a stop, a failure, a story, a case by hand', () => {
    expect(
      homeCountOf({
        asking: [{ ...PLAN, kind: 'asking', question: '?' }],
        going: [{ ...PLAN, kind: 'paused' }],
        toContinue: [{ ...PLAN, kind: 'toContinue', cases: 2 }],
        failed: [{ ...PLAN, kind: 'failed', failed: 1, bugs: 1 }],
        arrived: [{ ...PLAN, kind: 'arrived', key: 'SHOP-878' }],
        answered: [{ ...PLAN, kind: 'answered', ids: ['D1'] }],
        byHand: [{ ...PLAN, kind: 'byHand', cases: 2, caseId: 'TC-07' }],
        toDevelop: [{ ...PLAN, kind: 'toDevelop', cases: 3 }],
        recent: [],
      }),
    ).toBe(6);
  });

  it('counts nothing while every plan is at rest', () => {
    expect(
      homeCountOf({
        asking: [],
        going: [],
        toContinue: [],
        failed: [],
        arrived: [],
        answered: [],
        byHand: [],
        toDevelop: [],
        recent: [],
      }),
    ).toBe(0);
  });
});
