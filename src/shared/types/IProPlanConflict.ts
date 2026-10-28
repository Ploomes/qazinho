import type { IProSyncCase } from './IProSyncCase';

/**
 * Um plano que a org mexeu desde que este computador o mandou por último: os casos de
 * onde os dois lados partiram, e a versão da org como está, com quem a mexeu e quando.
 */
export interface IProPlanConflict {
  workspaceId: string;
  base: IProSyncCase[];
  version: number;
  cases: IProSyncCase[];
  editedBy: string | null;
  editedAt: string;
}
