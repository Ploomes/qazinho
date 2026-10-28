import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IProSyncPlan } from '@/shared/types';
import { hashOf } from './hashOf';
import { planBodyOf } from './planBodyOf';

/**
 * Os planos do registro com cada um tirado da org identificado como está aqui, enquanto
 * os casos dele ainda são os que veio com.
 */
export function healedPlansOf(props: {
  record: IProSyncRecord;
  plans: IProSyncPlan[];
}): IProSyncRecord['plans'] {
  const { record, plans } = props;
  const healed = { ...record.plans };

  for (const plan of plans) {
    const kept = healed[plan.workspaceId];
    const body = planBodyOf(plan);

    if (kept?.hash === '' && hashOf(kept.cases) === hashOf(body.cases))
      healed[plan.workspaceId] = { ...kept, hash: hashOf(body) };
  }

  return healed;
}
