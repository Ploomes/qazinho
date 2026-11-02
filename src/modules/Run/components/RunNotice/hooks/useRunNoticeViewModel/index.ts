import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isSeenIn } from '@/modules/Bug/library';
import { RUN_NOTICE } from '@/modules/Run/components/RunNotice/constants';
import { useOpenRun } from '@/modules/Run/hooks/useOpenRun';
import { caseVerdict, countVerdicts } from '@/modules/Run/library';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useRunNoticeViewModel = () => {
  const { t } = useTranslation();
  const live = useAppStore((state) => state.runNotice);
  const [notice] = useState(live);
  const closeRunNotice = useAppStore((state) => state.closeRunNotice);
  const openReplay = useAppStore((state) => state.openReplay);
  const workspace = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === notice?.workspaceId) ?? null,
  );
  const openRun = useOpenRun();

  const run = workspace?.runs.find(({ id }) => id === notice?.runId) ?? null;
  const bugCount = (workspace?.bugs ?? []).filter(
    (bug) => run !== null && isSeenIn({ bug, runId: run.id }),
  ).length;
  const isExploration = run?.kind === 'explore';
  const held =
    run === null ? 0 : isExploration ? bugCount : run.counts.failed + run.counts.blocked;
  const isBroke = run?.endedBy === 'broke';
  const bugsSaid =
    bugCount === 0
      ? ''
      : t(bugCount === 1 ? 'SIDEBAR.META_BUG_ONE' : 'SIDEBAR.META_BUG_OTHER', {
          count: bugCount,
        });
  const screens = run?.counts.passed ?? 0;
  const caseCounts = countVerdicts(
    (run?.cases ?? []).map(({ steps }) => caseVerdict(steps)),
  );

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
    kicker: t(
      isExploration
        ? isBroke
          ? 'RUN.NOTICE_EXPLORE_BROKE'
          : 'RUN.NOTICE_EXPLORED'
        : isBroke
          ? 'RUN.NOTICE_BROKE'
          : 'RUN.NOTICE_FINISHED',
      { id: run?.id ?? '' },
    ),
    title: workspace?.name ?? '',
    tally: (isExploration ? [] : (['passed', 'failed', 'blocked'] as const))
      .filter((verdict) => caseCounts[verdict] > 0)
      .map((verdict) => ({
        key: verdict,
        icon: STATUS[verdict].icon,
        count: caseCounts[verdict],
        label: t(STATUS[verdict].labelKey),
        className: `run-notice__count run-notice__count--${STATUS[verdict].tone}`,
      })),
    bugs: isExploration
      ? [
          screens === 1
            ? t('CHAT.EXPLORE_SCREENS_ONE')
            : t('CHAT.EXPLORE_SCREENS_OTHER', { count: screens }),
          ...(bugsSaid === '' ? [] : [bugsSaid]),
        ].join(' · ')
      : bugsSaid,
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
