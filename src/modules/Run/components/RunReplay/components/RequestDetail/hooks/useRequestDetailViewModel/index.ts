import type { IRequestDetailProps } from '@/modules/Run/components/RunReplay/components/RequestDetail/types';
import type { CSSProperties, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { REQUEST_DETAIL } from '@/modules/Run/components/RunReplay/components/RequestDetail/constants';
import { NETWORK, REQUEST_OUTCOMES } from '@/modules/Run/constants';
import { formatClock, formatRequestSize, formatRequestTime } from '@/modules/Run/library';
import { MOTION } from '@/shared/constants';

export const useRequestDetailViewModel = (props: IRequestDetailProps) => {
  const { request, onSeek, onClose } = props;
  const { t, i18n } = useTranslation();
  const cardRef = useRef<HTMLElement>(null);
  const [isCopied, setCopied] = useState(false);
  const outcome = REQUEST_OUTCOMES[request.outcome];
  const isDone = request.durationMs !== null;
  const code =
    request.status !== null && request.status >= 100 ? String(request.status) : '—';
  const typeLabels: Readonly<Record<string, string>> = NETWORK.types;

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isCopied) return;

    const timer = setTimeout(() => {
      setCopied(false);
    }, REQUEST_DETAIL.copiedMs);

    return () => {
      clearTimeout(timer);
    };
  }, [isCopied]);

  return {
    cardRef,
    style: {
      '--request-detail-width': `${String(REQUEST_DETAIL.widthPx)}px`,
      '--request-detail-fact': `${String(REQUEST_DETAIL.factMinPx)}px`,
      '--request-detail-body': `${String(REQUEST_DETAIL.bodyMaxPx)}px`,
    } as CSSProperties,
    transition: { duration: MOTION.durationFast, ease: MOTION.ease },
    label: t('RUN.REQUEST_LABEL', { method: request.method, path: request.path }),
    method: request.method,
    path: request.path,
    statusClassName: `request-detail__status request-detail__status--${isDone ? outcome.tone : 'pending'}`,
    statusIcon: isDone ? outcome.icon : ('pending' as const),
    statusText: !isDone
      ? t('RUN.REQUEST_NO_END')
      : outcome.wordKey === null
        ? code
        : t(outcome.wordKey),
    url: request.url,
    facts: [
      {
        id: 'type',
        label: t('RUN.REQUEST_TYPE'),
        value: typeLabels[request.type] ?? request.type,
      },
      { id: 'at', label: t('RUN.REQUEST_AT'), value: formatClock(request.fromMs) },
      {
        id: 'took',
        label: t('RUN.REQUEST_TOOK'),
        value:
          request.durationMs === null
            ? t('RUN.REQUEST_NO_END')
            : formatRequestTime({ ms: request.durationMs, language: i18n.language }),
      },
      ...(request.size === null
        ? []
        : [
            {
              id: 'size',
              label: t('RUN.REQUEST_SIZE'),
              value: formatRequestSize({ bytes: request.size, language: i18n.language }),
            },
          ]),
    ],
    hasFailure: request.failure !== null,
    failureLabel: t('RUN.REQUEST_ERROR'),
    failure: request.failure ?? '',
    hasBody: request.body !== null,
    bodyLabel: t('RUN.REQUEST_ANSWER'),
    body: request.body ?? '',
    hasNote: request.body === null,
    note: t('RUN.REQUEST_ANSWER_NOTE'),
    closeLabel: t('RUN.REQUEST_CLOSE'),
    copyLabel: isCopied ? t('RUN.REQUEST_COPIED') : t('RUN.REQUEST_COPY'),
    seeLabel: t('RUN.REQUEST_SEE'),
    onBackdropClick: (event: MouseEvent) => {
      event.stopPropagation();
      onClose();
    },
    onCardClick: (event: MouseEvent) => {
      event.stopPropagation();
    },
    onCopy: () => {
      void navigator.clipboard?.writeText(request.url).then(
        () => {
          setCopied(true);
        },
        () => undefined,
      );
    },
    onSee: () => {
      onSeek(Math.max(0, request.fromMs - NETWORK.leadMs));
      onClose();
    },
    onClose,
  };
};
