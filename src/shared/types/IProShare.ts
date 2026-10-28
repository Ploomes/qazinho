import type { IProPlanConflict } from './IProPlanConflict';
import type { ProSyncState } from './ProSyncState';

/**
 * Se um projeto está ligado a uma org do QAzinho Pro, em que pé está a sincronização, os
 * planos editados aqui e ainda não mandados, e cada plano que a org mexeu desde então.
 */
export interface IProShare {
  projectId: string;
  orgSlug: string | null;
  state: ProSyncState;
  syncedAt: string | null;
  pending: string[];
  conflicts: IProPlanConflict[];
}
