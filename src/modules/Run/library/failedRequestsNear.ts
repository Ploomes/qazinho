import type { INetworkEntry } from '@/shared/types';
import { NETWORK } from '@/modules/Run/constants';
import { requestOutcomeOf } from './requestOutcomeOf';

/**
 * Os pedidos que falharam em volta de um momento de uma run, na ordem em que foram
 * feitos.
 */
export function failedRequestsNear(props: {
  entries: INetworkEntry[];
  at: number;
  beforeMs: number;
  afterMs: number;
  limit: number;
}): INetworkEntry[] {
  const { entries, at } = props;
  const failed: readonly string[] = NETWORK.errorOutcomes;

  return entries
    .filter(
      (entry) =>
        entry.startedAt >= at - props.beforeMs &&
        entry.startedAt <= at + props.afterMs &&
        failed.includes(requestOutcomeOf(entry)),
    )
    .sort((one, other) => one.startedAt - other.startedAt || one.id - other.id)
    .slice(-props.limit);
}
