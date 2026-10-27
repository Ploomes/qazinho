import type { IProSyncPlan } from './IProSyncPlan';
import type { IProSyncProject } from './IProSyncProject';
import type { IVariableBrief } from './IVariableBrief';

/**
 * A project downloaded from its org with its plans and variables' names, or why it was
 * not.
 */
export type ProDownload =
  | {
      isDownloaded: true;
      orgSlug: string;
      project: IProSyncProject;
      plans: IProSyncPlan[];
      variables: IVariableBrief[];
    }
  | {
      isDownloaded: false;
      failure: 'signed-out' | 'unreachable' | 'gone' | 'here' | 'failed';
    };
