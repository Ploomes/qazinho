import type { ProSyncState } from '@/shared/types';

/** What this machine remembers of one shared project: the org, where its sync stands, and what already reached the org, so nothing goes twice. */
export interface IProSyncRecord {
  orgSlug: string;
  state: ProSyncState;
  syncedAt: string | null;
  conflicts: string[];
  project: string | null;
  plans: Record<string, { planId: string; version: number; hash: string }>;
  runs: Record<string, string>;
  bugs: Record<string, string>;
  recordings: Record<string, string>;
  evidence: Record<string, string>;
}
