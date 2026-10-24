import type { IProSyncCase } from './IProSyncCase';

/** A plan the org moved since this computer last sent it: the cases both sides started from, and the org's version as it stands, with who moved it and when. */
export interface IProPlanConflict {
  workspaceId: string;
  base: IProSyncCase[];
  version: number;
  cases: IProSyncCase[];
  editedBy: string | null;
  editedAt: string;
}
