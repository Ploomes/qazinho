import type { SyncedProject } from '@/main/classes/pro/ProDownloads/types';
import type { IProSyncPlan } from '@/shared/types';

/**
 * A plan of the org as a workspace of this computer: on the target it names, else one of
 * its kind, else the project's first.
 */
export function downloadedPlanOf(props: {
  plan: SyncedProject['plans'][number];
  targets: SyncedProject['targets'];
}): IProSyncPlan {
  const { plan, targets } = props;
  const target =
    targets.find(({ id }) => id === plan.targetId) ??
    targets.find(({ kind }) => kind === plan.targetKind) ??
    targets[0];

  return {
    workspaceId: plan.desktopId,
    name: plan.name,
    targetId: target?.id ?? '',
    targetKind: target?.kind ?? plan.targetKind ?? 'web',
    issue: plan.issue ?? null,
    design: plan.design ?? null,
    cases: plan.cases,
  };
}
