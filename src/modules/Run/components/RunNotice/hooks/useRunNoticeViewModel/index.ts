import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { RUN_NOTICE } from '@/modules/Run/components/RunNotice/constants';
import { useOpenRun } from '@/modules/Run/hooks/useOpenRun';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useRunNoticeViewModel = () => {
  const { t } = useTranslation();
  const notice = useAppStore((state) => state.runNotice);
  const closeRunNotice = useAppStore((state) => state.closeRunNotice);
  const openReplay = useAppStore((state) => state.openReplay);
  const workspace = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === notice?.workspaceId) ?? null,
  );
  const openRun = useOpenRun();

  const run = workspace?.runs.find(({ id }) => id === notice?.runId) ?? null;
  const bugCount = (workspace?.bugs ?? []).filter(
    ({ runId }) => runId === run?.id,
  ).length;
  const held = run === null ? 0 : run.counts.failed + run.counts.blocked;
  const isBroke = run?.endedBy === 'broke';

  return {
    isShown: notice !== null && run !== null,
    style: {
      '--notice-ms': `${String(RUN_NOTICE.durationMs)}ms`,
      '--notice-width': `${String(RUN_NOTICE.widthPx)}px`,
      '--notice-top': `${String(RUN_NOTICE.topPx)}px`,
    } as CSSProperties,
    mood: isBroke
      ? ('broken' as const)
      : held > 0
        ? ('bug' as const)
        : ('passed' as const),
    internSize: RUN_NOTICE.internSize,
    kicker: t(isBroke ? 'RUN.NOTICE_BROKE' : 'RUN.NOTICE_FINISHED', {
      id: run?.id ?? '',
    }),
    title: workspace?.name ?? '',
    tally: (['passed', 'failed', 'blocked'] as const)
      .filter((verdict) => verdict !== 'blocked' || (run?.counts.blocked ?? 0) > 0)
      .map((verdict) => ({
        key: verdict,
        glyph: STATUS[verdict].glyph,
        count: run?.counts[verdict] ?? 0,
        label: t(STATUS[verdict].labelKey),
        className: `run-notice__count run-notice__count--${STATUS[verdict].tone}`,
      })),
    bugs:
      bugCount === 0
        ? ''
        : t(bugCount === 1 ? 'SIDEBAR.META_BUG_ONE' : 'SIDEBAR.META_BUG_OTHER', {
            count: bugCount,
          }),
    openLabel: t('RUN.NOTICE_OPEN'),
    canWatch: run?.video !== null && run?.video !== undefined,
    watchLabel: t('RUN.NOTICE_WATCH'),
    closeLabel: t('COMMON.CLOSE'),
    onOpen: () => {
      if (notice !== null) openRun(notice);

      closeRunNotice();
    },
    onWatch: () => {
      if (notice !== null) {
        openRun(notice);
        openReplay({
          workspaceId: notice.workspaceId,
          runId: notice.runId,
          focus: { kind: 'run' },
        });
      }

      closeRunNotice();
    },
    onClose: closeRunNotice,
    onCountdownEnd: closeRunNotice,
  };
};
