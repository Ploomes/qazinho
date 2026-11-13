import { describe, expect, it } from 'vitest';
import { homeCountOf } from '@/modules/Home/library';

const PLAN = { workspaceId: 'w', plan: 'Cupom', project: 'Loja' };

describe('homeCountOf', () => {
  it('counts what waits on a move of the QA, and not what the agent drafts or the sprint offers', () => {
    expect(
      homeCountOf({
        asking: [{ ...PLAN, kind: 'asking', question: '?' }],
        toAnswer: [{ ...PLAN, kind: 'toAnswer', questions: 2 }],
        going: [{ ...PLAN, kind: 'paused' }],
        toContinue: [{ ...PLAN, kind: 'toContinue', cases: 2 }],
        failed: [{ ...PLAN, kind: 'failed', failed: 1, bugs: 1 }],
        arrived: [{ ...PLAN, kind: 'arrived', key: 'SHOP-878' }],
        answered: [{ ...PLAN, kind: 'answered', ids: ['D1'] }],
        changed: [{ ...PLAN, kind: 'changed', sources: ['SHOP-878'], toReview: 0 }],
        byHand: [{ ...PLAN, kind: 'byHand', cases: 2, caseId: 'TC-07' }],
        toDevelop: [{ ...PLAN, kind: 'toDevelop', cases: 3 }],
        drafting: [{ ...PLAN, kind: 'drafting', key: 'SHOP-892', isQueued: true }],
        toPlan: [
          {
            kind: 'toPlan',
            projectId: 'p1',
            project: 'Loja',
            sprint: 'Sprint 42',
            key: 'SHOP-893',
            title: 'Trocar o endereço',
            status: 'Pronto para dev',
            url: 'https://acme.atlassian.net/browse/SHOP-893',
          },
        ],
        recent: [],
      }),
    ).toBe(8);
  });

  it('counts nothing while every plan is at rest', () => {
    expect(
      homeCountOf({
        asking: [],
        toAnswer: [],
        going: [],
        toContinue: [],
        failed: [],
        arrived: [],
        answered: [],
        changed: [],
        byHand: [],
        toDevelop: [],
        drafting: [],
        toPlan: [],
        recent: [],
      }),
    ).toBe(0);
  });
});
