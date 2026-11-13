import type { SyncedProject } from '@/main/classes/pro/ProDownloads/types';
import type { IProSyncPlan } from '@/shared/types';

/**
 * Um plano da org como um workspace deste computador: no alvo que ele nomeia, senão num
 * do tipo dele, senão no primeiro do projeto.
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
    strategy: plan.strategy ?? null,
    doubts: plan.doubts ?? [],
    cases: plan.cases,
  };
}
