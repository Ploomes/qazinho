import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IProSyncPlan } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { hashOf, healedPlansOf, planBodyOf } from '@/main/classes/pro/ProSync/library';

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

describe('healedPlansOf', () => {
  it('fingerprints a plan taken from the org while its cases are the ones it came with', () => {
    const record = recordOf({
      w1: { planId: 'pl1', version: 7, hash: '', cases: PLAN.cases },
    });

    expect(healedPlansOf({ record, plans: [PLAN] }).w1?.hash).toBe(
      hashOf(planBodyOf(PLAN)),
    );
  });

  it('does NOT fingerprint a taken plan whose cases changed here, so it stays to be sent', () => {
    const record = recordOf({
      w1: { planId: 'pl1', version: 7, hash: '', cases: [] },
    });

    expect(healedPlansOf({ record, plans: [PLAN] }).w1?.hash).toBe('');
  });

  it('leaves a plan already fingerprinted, and one not here, as they were', () => {
    const record = recordOf({
      w1: { planId: 'pl1', version: 2, hash: 'h1', cases: PLAN.cases },
      w2: { planId: 'pl2', version: 1, hash: '', cases: [] },
    });

    expect(healedPlansOf({ record, plans: [PLAN] })).toEqual(record.plans);
  });
});
