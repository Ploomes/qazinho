import type { INetworkEntry } from '@/shared/types';
import { NETWORK } from '@/modules/Run/constants';
import { requestOutcomeOf } from './requestOutcomeOf';

/** The requests that failed around a moment of a run, in the order they were made: the ones started in the seconds before it or just after, that got an error or no answer, the closest kept. */
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
