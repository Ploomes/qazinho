import type { IProPlanConflict } from './IProPlanConflict';
import type { ProSyncState } from './ProSyncState';

/**
 * Whether a project is linked to an org of QAzinho Pro, where its sync stands, the plans
 * edited here and not sent yet, and each plan the org moved since.
 */
export interface IProShare {
  projectId: string;
  orgSlug: string | null;
  state: ProSyncState;
  syncedAt: string | null;
  pending: string[];
  conflicts: IProPlanConflict[];
}
