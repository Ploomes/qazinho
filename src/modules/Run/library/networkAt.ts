import type { INetworkAt, IReplayRequest } from '@/modules/Run/types';
import { NETWORK } from '@/modules/Run/constants';

/**
 * A rede num momento do vídeo: as últimas chamadas de API que começaram até ali, cada uma
 * terminada ou esperando, e o resto da rede só quando o QA pede tudo.
 */
export function networkAt(props: {
  requests: IReplayRequest[];
  atMs: number;
  isShowingAll: boolean;
}): INetworkAt {
  const { requests, atMs, isShowingAll } = props;
  const errors: readonly string[] = NETWORK.errorOutcomes;
  const kept = isShowingAll ? requests : requests.filter(({ isApi }) => isApi);
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
    others: requests.filter(({ isApi }) => !isApi).length,
  };
}
