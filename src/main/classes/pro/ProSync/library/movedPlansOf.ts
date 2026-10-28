import type { SYNCED_PROJECTS_SCHEMA } from '@/main/classes/pro/ProApi/constants';
import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IProPlanConflict } from '@/shared/types';
import type { z } from 'zod';

type SyncedPlan = z.infer<
  typeof SYNCED_PROJECTS_SCHEMA
>['projects'][number]['plans'][number];

/**
 * Os planos que a org mexeu além do que este computador mandou por último, cada um um
 * conflito para a página juntar.
 */
export function movedPlansOf(props: {
  record: IProSyncRecord;
  plans: SyncedPlan[];
}): IProPlanConflict[] {
  const { record, plans } = props;

  return Object.entries(record.plans).flatMap(([workspaceId, kept]) => {
    const org = plans.find((plan) =>
      kept.planId === null ? plan.desktopId === workspaceId : plan.id === kept.planId,
    );
    const waiting = record.conflicts.find((one) => one.workspaceId === workspaceId);
    if (!org || org.version <= (waiting?.version ?? kept.version)) return [];

    return [
      {
        workspaceId,
        base: waiting?.base ?? kept.cases,
        version: org.version,
        cases: org.cases,
        editedBy: org.editedBy ?? null,
        editedAt: org.editedAt ?? '',
      },
    ];
  });
}
