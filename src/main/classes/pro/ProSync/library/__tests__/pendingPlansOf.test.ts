import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IProSyncPlan } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { hashOf, pendingPlansOf, planBodyOf } from '@/main/classes/pro/ProSync/library';

const PLAN: IProSyncPlan = {
  workspaceId: 'w1',
  name: 'Checkout com Pix',
  targetId: 't1',
  targetKind: 'web',
  issue: null,
  design: null,
  cases: [
    {
      id: 'c1',
      title: 'Pagar com Pix',
      priority: 'P1',
      goal: 'Pagar',
      preconditions: '',
      steps: [{ action: 'Copiar o código', expected: 'Copiado' }],
    },
  ],
};

const recordOf = (plans: IProSyncRecord['plans']): IProSyncRecord => ({
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: null,
  mediaFrom: null,
  pending: [],
  conflicts: [],
  memories: null,
  project: 'hash',
  plans,
  runs: {},
  bugs: {},
  recordings: {},
  evidence: {},
});

describe('pendingPlansOf', () => {
  it('names a plan edited since the org took it', () => {
    const record = recordOf({
      w1: {
        planId: 'pl1',
        version: 2,
        hash: hashOf(planBodyOf(PLAN)),
        cases: PLAN.cases,
      },
    });

    expect(pendingPlansOf({ record, plans: [{ ...PLAN, name: 'Outro' }] })).toEqual([
      'w1',
    ]);
  });

  it('does NOT name a plan the org already has as it stands', () => {
    const record = recordOf({
      w1: {
        planId: 'pl1',
        version: 2,
        hash: hashOf(planBodyOf(PLAN)),
        cases: PLAN.cases,
      },
    });

    expect(pendingPlansOf({ record, plans: [PLAN] })).toEqual([]);
  });

  it('names a plan the org never took', () => {
    expect(pendingPlansOf({ record: recordOf({}), plans: [PLAN] })).toEqual(['w1']);
  });
});
