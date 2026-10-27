import type { IProPlanConflict, IProSyncCase, ProSyncState } from '@/shared/types';

/**
 * What this machine remembers of one linked project: its org, where it stands, and what
 * already reached the org, so nothing goes twice.
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
