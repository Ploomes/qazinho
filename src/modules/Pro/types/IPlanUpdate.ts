import type { ICaseClash } from './ICaseClash';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IProPlanConflict, IProSyncCase } from '@/shared/types';

/**
 * Um plano que a org mexeu, como aceitá-lo aqui o deixaria: o workspace em que cai, os
 * casos juntados, os casos que os dois lados mudaram, e se uma run o segura agora.
 */
export interface IPlanUpdate {
  conflict: IProPlanConflict;
  workspace: IWorkspace;
  cases: IProSyncCase[];
  clashes: ICaseClash[];
  isBusy: boolean;
}
