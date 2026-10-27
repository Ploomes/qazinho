import type { INetworkAt, IReplayRequest } from '@/modules/Run/types';
import { NETWORK } from '@/modules/Run/constants';

/**
 * The network at one moment of the video: the latest requests that started by then, each
 * ended or still waiting, with the files left out unless the QA shows them.
 */
export function networkAt(props: {
  requests: IReplayRequest[];
  atMs: number;
  isShowingFiles: boolean;
}): INetworkAt {
  const { requests, atMs, isShowingFiles } = props;
  const errors: readonly string[] = NETWORK.errorOutcomes;
  const kept = isShowingFiles ? requests : requests.filter(({ isFile }) => !isFile);
  const started = kept.filter(({ fromMs }) => fromMs <= atMs);
  const isDone = (request: IReplayRequest) =>
    request.toMs !== null && request.toMs <= atMs;

  return {
    rows: started.slice(-NETWORK.rowLimit).map((request) => ({
      request,
      isDone: isDone(request),
      elapsedMs: isDone(request) ? (request.durationMs ?? 0) : atMs - request.fromMs,
    })),
    shown: started.length,
    total: kept.length,
    errors: started.filter(
      (request) => isDone(request) && errors.includes(request.outcome),
    ).length,
    earlier: Math.max(0, started.length - NETWORK.rowLimit),
    files: requests.filter(({ isFile }) => isFile).length,
  };
}
