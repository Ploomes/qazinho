import type { IDesignLink } from './IDesignLink';
import type { IPlanDoubt } from './IPlanDoubt';
import type { IPlanStrategy } from './IPlanStrategy';
import type { IProSyncCase } from './IProSyncCase';
import type { TargetKind } from './TargetKind';

/**
 * O plano de um workspace como vai ao QAzinho Pro: o nome, o alvo em que roda, de onde
 * veio, a estratégia, as dúvidas e os casos.
 */
export interface IProSyncPlan {
  workspaceId: string;
  name: string;
  targetId: string;
  targetKind: TargetKind;
  issue: { key: string; title: string; source: string; url: string } | null;
  design: IDesignLink | null;
  strategy?: IPlanStrategy | null;
  doubts?: IPlanDoubt[];
  cases: IProSyncCase[];
}
