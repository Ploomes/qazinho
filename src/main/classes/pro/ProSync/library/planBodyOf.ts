import type { IProSyncPlan } from '@/shared/types';

/**
 * O plano como a plataforma o aceita, antes de a versão em que foi baseado e a máquina
 * serem acrescentadas.
 */
export function planBodyOf(plan: IProSyncPlan) {
  return {
    name: plan.name,
    targetId: plan.targetId,
    targetKind: plan.targetKind,
    issue: plan.issue,
    design: plan.design,
    cases: plan.cases,
  };
}
