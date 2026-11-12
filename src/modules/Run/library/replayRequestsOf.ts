import type { INetworkEntry, IReplayRequest, IRunVideo } from '@/modules/Run/types';
import { NETWORK } from '@/modules/Run/constants';
import { appOriginOf } from './appOriginOf';
import { requestOutcomeOf } from './requestOutcomeOf';
import { urlPartsOf } from './urlPartsOf';

/**
 * Os pedidos de uma run postos no vídeo dela, na ordem em que começaram; um feito antes
 * de o vídeo começar começa no primeiro frame.
 */
export function replayRequestsOf(props: {
  entries: INetworkEntry[];
  video: Pick<IRunVideo, 'startedAt' | 'durationMs'>;
}): IReplayRequest[] {
  const { entries, video } = props;
  const appOrigin = appOriginOf(entries);
  const apis: readonly string[] = NETWORK.apiTypes;

  return entries
    .map((entry) => {
      const parts = urlPartsOf(entry.url);
      const fromMs = Math.min(
        video.durationMs,
        Math.max(0, entry.startedAt - video.startedAt),
      );

      return {
        id: entry.id,
        method: entry.method,
        url: entry.url,
        host: parts.origin === appOrigin ? null : parts.host,
        path: parts.path,
        type: entry.type,
        isApi: apis.includes(entry.type),
        outcome: requestOutcomeOf(entry),
        status: entry.status,
        failure: entry.failure,
        fromMs,
        toMs:
          entry.durationMs === null
            ? null
            : Math.max(fromMs, entry.startedAt + entry.durationMs - video.startedAt),
        durationMs: entry.durationMs,
        size: entry.size,
        body: entry.body ?? null,
      };
    })
    .sort((one, other) => one.fromMs - other.fromMs || one.id - other.id);
}
