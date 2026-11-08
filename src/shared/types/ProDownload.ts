import type { IMemory } from './IMemory';
import type { IProSyncPlan } from './IProSyncPlan';
import type { IProSyncProject } from './IProSyncProject';
import type { IVariableBrief } from './IVariableBrief';

/**
 * Um projeto baixado da org com os planos e os nomes das variáveis, ou por que não foi.
 */
export type ProDownload =
  | {
      isDownloaded: true;
      orgSlug: string;
      project: IProSyncProject;
      plans: IProSyncPlan[];
      variables: IVariableBrief[];
      memories: IMemory[];
    }
  | {
      isDownloaded: false;
      failure: 'signed-out' | 'unreachable' | 'gone' | 'here' | 'failed';
    };
