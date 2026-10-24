import type { IProSyncBug } from './IProSyncBug';
import type { IProSyncPlan } from './IProSyncPlan';
import type { IProSyncProject } from './IProSyncProject';
import type { IProSyncRun } from './IProSyncRun';

/** Everything a shared project holds, as the page hands it to main to send to its org; main skips what did not change. */
export interface IProSyncBatch {
  project: IProSyncProject;
  plans: IProSyncPlan[];
  runs: IProSyncRun[];
  bugs: IProSyncBug[];
}
