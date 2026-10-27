import type { IProPlanConflict } from './IProPlanConflict';
import type { ProSyncState } from './ProSyncState';

/**
 * Whether a project goes to an org of QAzinho Pro, where its sync stands, when it last
 * reached the org, and each plan the org moved since.
 */
export interface IProShare {
  projectId: string;
  orgSlug: string | null;
  state: ProSyncState;
  syncedAt: string | null;
  conflicts: IProPlanConflict[];
}
