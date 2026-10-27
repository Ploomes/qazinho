import type { ICaseClash } from './ICaseClash';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IProPlanConflict, IProSyncCase } from '@/shared/types';

/**
 * A plan the org moved, as taking it in here would leave it: the workspace it lands on,
 * the cases joined, the cases both sides changed, and whether a run holds it now.
 */
export interface IPlanUpdate {
  conflict: IProPlanConflict;
  workspace: IWorkspace;
  cases: IProSyncCase[];
  clashes: ICaseClash[];
  isBusy: boolean;
}
