import type { IProSyncBug } from './IProSyncBug';
import type { IProSyncPlan } from './IProSyncPlan';
import type { IProSyncProject } from './IProSyncProject';
import type { IProSyncRun } from './IProSyncRun';

/**
 * Tudo o que um projeto compartilhado guarda, como a página o entrega à main para mandar
 * à org dele; a main pula o que não mudou.
 */
export interface IProSyncBatch {
  project: IProSyncProject;
  plans: IProSyncPlan[];
  runs: IProSyncRun[];
  bugs: IProSyncBug[];
}
