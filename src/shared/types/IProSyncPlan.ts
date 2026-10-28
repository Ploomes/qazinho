import type { IDesignLink } from './IDesignLink';
import type { IProSyncCase } from './IProSyncCase';
import type { TargetKind } from './TargetKind';

/**
 * O plano de um workspace como vai ao QAzinho Pro: o nome, o alvo em que roda, de onde
 * veio, e os casos.
 */
export interface IProSyncPlan {
  workspaceId: string;
  name: string;
  targetId: string;
  targetKind: TargetKind;
  issue: { key: string; title: string; source: string; url: string } | null;
  design: IDesignLink | null;
  cases: IProSyncCase[];
}
