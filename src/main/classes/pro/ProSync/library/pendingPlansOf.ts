import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IProSyncPlan } from '@/shared/types';
import { hashOf } from './hashOf';
import { planBodyOf } from './planBodyOf';

/** The workspaces whose plan changed here since the org last took it. */
export function pendingPlansOf(props: {
  record: IProSyncRecord;
  plans: IProSyncPlan[];
}): string[] {
  const { record, plans } = props;

  return plans.flatMap((plan) =>
    record.plans[plan.workspaceId]?.hash === hashOf(planBodyOf(plan))
      ? []
      : [plan.workspaceId],
  );
}
