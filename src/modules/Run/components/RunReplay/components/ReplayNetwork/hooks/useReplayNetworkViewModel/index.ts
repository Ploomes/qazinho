import type { IReplayNetworkProps } from '@/modules/Run/components/RunReplay/components/ReplayNetwork/types';
import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { REPLAY_NETWORK } from '@/modules/Run/components/RunReplay/components/ReplayNetwork/constants';
import { NETWORK, REQUEST_OUTCOMES } from '@/modules/Run/constants';
import {
  formatClock,
  formatRequestSize,
  formatRequestTime,
  networkAt,
  requestBarOf,
} from '@/modules/Run/library';
import { MOTION } from '@/shared/constants';

export const useReplayNetworkViewModel = (props: IReplayNetworkProps) => {
  const { requests, currentMs, isShowingFiles, onToggleFiles, onSeek } = props;
  const { t, i18n } = useTranslation();
  const listRef = useRef<HTMLOListElement>(null);
  const quietUntil = useRef(0);
  const at = networkAt({ requests, atMs: currentMs, isShowingFiles });
  const latestId = at.rows.at(-1)?.request.id ?? null;
  const typeLabels: Readonly<Record<string, string>> = NETWORK.types;

  useEffect(() => {
    const list = listRef.current;

    if (list === null || Date.now() < quietUntil.current) return;

    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [latestId, at.rows.length]);

  return {
    style: {
      '--network-height': `${String(REPLAY_NETWORK.heightPx)}px`,
      '--network-columns': REPLAY_NETWORK.columns,
    } as CSSProperties,
    title: t('RUN.REPLAY_NETWORK'),
    count: t('RUN.NETWORK_COUNT', { shown: at.shown, total: at.total }),
    hasErrors: at.errors > 0,
    errors:
      at.errors === 1
        ? t('RUN.NETWORK_ERRORS_ONE')
        : t('RUN.NETWORK_ERRORS_OTHER', { count: at.errors }),
    hasFiles: at.files > 0,
    isShowingFiles,
    filesLabel: isShowingFiles
      ? t('RUN.NETWORK_FILES_HIDE')
      : at.files === 1
        ? t('RUN.NETWORK_FILES_ONE')
        : t('RUN.NETWORK_FILES_OTHER', { count: at.files }),
    filesTitle: t('RUN.NETWORK_FILES_TIP'),
    listRef,
    hasEarlier: at.earlier > 0,
    earlier: t('RUN.NETWORK_EARLIER', { count: at.earlier }),
    isEmpty: at.rows.length === 0,
    empty: at.total === 0 ? t('RUN.NETWORK_ONLY_FILES') : t('RUN.NETWORK_NONE_YET'),
    rowLand: { opacity: 1, y: 0 },
    rowTransition: { duration: MOTION.duration, ease: MOTION.ease },
    nowTransition: { duration: MOTION.duration, ease: MOTION.ease },
    swapTransition: { duration: MOTION.durationFast, ease: MOTION.ease },
    rows: at.rows.map(({ request, isDone, elapsedMs }) => {
      const outcome = REQUEST_OUTCOMES[request.outcome];
      const tone = isDone ? outcome.tone : 'pending';
      const code =
        request.status !== null && request.status >= 100 ? String(request.status) : '—';

      return {
        key: request.id,
        initial:
          currentMs - request.fromMs < NETWORK.freshMs
            ? { opacity: 0, y: REPLAY_NETWORK.arriveY }
            : (false as const),
        className: `replay-network__row replay-network__row--${tone}`,
        isLatest: request.id === latestId,
        title: [
          `${request.method} ${request.url}`,
          ...(request.failure === null ? [] : [request.failure]),
          ...(isDone ? [] : [t('RUN.NETWORK_WAITING')]),
        ].join('\n'),
        clock: formatClock(request.fromMs),
        method: request.method,
        statusKey: isDone ? 'done' : 'waiting',
        statusClassName: `replay-network__status replay-network__status--${tone}`,
        icon: isDone ? outcome.icon : ('pending' as const),
        iconClassName: isDone
          ? 'replay-network__status-icon'
          : 'replay-network__status-icon replay-network__status-icon--spin',
        statusText: !isDone ? '' : outcome.wordKey === null ? code : t(outcome.wordKey),
        statusLabel: isDone ? undefined : t('RUN.NETWORK_WAITING'),
        hasHost: request.host !== null,
        host: request.host ?? '',
        path: request.path,
        type: typeLabels[request.type] ?? request.type,
        fillClassName: `replay-network__fill replay-network__fill--${tone}`,
        fillStyle: { '--fill': String(requestBarOf(elapsedMs)) } as CSSProperties,
        time: formatRequestTime({ ms: elapsedMs, language: i18n.language }),
        size:
          !isDone || request.size === null
            ? ''
            : formatRequestSize({ bytes: request.size, language: i18n.language }),
        onClick: () => {
          onSeek(Math.max(0, request.fromMs - NETWORK.leadMs));
        },
      };
    }),
    onToggleFiles,
    onUserScroll: () => {
      quietUntil.current = Date.now() + REPLAY_NETWORK.quietMs;
    },
  };
};
