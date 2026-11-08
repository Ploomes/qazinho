import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IProSyncCase } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { movedPlansOf } from '@/main/classes/pro/ProSync/library';

const CASE: IProSyncCase = {
  id: 'c1',
  title: 'Pagar com Pix',
  priority: 'P1',
  goal: 'Pagar',
  preconditions: '',
  steps: [{ action: 'Clicar em "Copiar código"', expected: 'Copiado' }],
};
const MERGED: IProSyncCase = {
  ...CASE,
  steps: [{ action: 'Clicar em "Copiar Pix"', expected: 'Copiado' }],
};

/**
 * Este computador mandou o plano Pix na versão 2, e um segundo plano que nunca chegou à
 * org.
 */
const recordOf = (change: Partial<IProSyncRecord> = {}): IProSyncRecord => ({
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: '2026-10-26T10:00:00.000Z',
  mediaFrom: null,
  pending: [],
  conflicts: [],
  memories: null,
  project: 'hash',
  plans: {
    w1: { planId: 'pl1', version: 2, hash: 'h1', cases: [CASE] },
    w2: { planId: null, version: 0, hash: '', cases: [] },
  },
  runs: {},
  bugs: {},
  recordings: {},
  evidence: {},
  ...change,
});
const planOf = (version: number) => ({
  id: 'pl1',
  desktopId: 'w1',
  name: 'Pagamento',
  version,
  cases: [MERGED],
  editedBy: 'Edu',
  editedAt: '2026-10-26T12:00:00.000Z',
});

describe('movedPlansOf', () => {
  it('hands over a plan the org moved past what this computer sent, from the cases both started at', () => {
    expect(movedPlansOf({ record: recordOf(), plans: [planOf(3)] })).toEqual([
      {
        workspaceId: 'w1',
        base: [CASE],
        version: 3,
        cases: [MERGED],
        editedBy: 'Edu',
        editedAt: '2026-10-26T12:00:00.000Z',
      },
    ]);
  });

  it('leaves a plan at the version this computer sent, or one the org does not hold', () => {
    expect(movedPlansOf({ record: recordOf(), plans: [planOf(2)] })).toEqual([]);
    expect(movedPlansOf({ record: recordOf(), plans: [] })).toEqual([]);
  });

  it('follows the org past a plan already waiting on the page, from the same start', () => {
    const waiting = {
      workspaceId: 'w1',
      base: [CASE],
      version: 3,
      cases: [MERGED],
      editedBy: 'Edu',
      editedAt: '2026-10-26T12:00:00.000Z',
    };

    expect(
      movedPlansOf({ record: recordOf({ conflicts: [waiting] }), plans: [planOf(3)] }),
    ).toEqual([]);
    expect(
      movedPlansOf({ record: recordOf({ conflicts: [waiting] }), plans: [planOf(4)] }),
    ).toEqual([{ ...waiting, version: 4 }]);
  });

  it('finds by its workspace a plan that never came back from the org with its id', () => {
    const fresh = {
      ...planOf(1),
      id: 'pl2',
      desktopId: 'w2',
      editedBy: null,
      editedAt: null,
    };

    expect(movedPlansOf({ record: recordOf(), plans: [fresh] })).toEqual([
      expect.objectContaining({
        workspaceId: 'w2',
        base: [],
        version: 1,
        editedBy: null,
        editedAt: '',
      }),
    ]);
  });
});
