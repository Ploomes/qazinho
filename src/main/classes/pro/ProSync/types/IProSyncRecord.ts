import type { IProPlanConflict, IProSyncCase, ProSyncState } from '@/shared/types';

/**
 * O que esta máquina lembra de um projeto ligado: a org dele, em que pé está, e o que já
 * chegou à org, para nada ir duas vezes.
 */
export interface IProSyncRecord {
  orgSlug: string;
  state: ProSyncState;
  syncedAt: string | null;
  mediaFrom: string | null;
  pending: string[];
  conflicts: IProPlanConflict[];
  project: string | null;
  plans: Record<
    string,
    { planId: string | null; version: number; hash: string; cases: IProSyncCase[] }
  >;
  runs: Record<string, string>;
  bugs: Record<string, string>;
  recordings: Record<string, string>;
  evidence: Record<string, string>;
}
