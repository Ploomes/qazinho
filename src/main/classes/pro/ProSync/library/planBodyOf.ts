import type { IProSyncPlan } from '@/shared/types';

/**
 * The plan as the platform takes it, before the version it was based on and the machine
 * are added.
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
