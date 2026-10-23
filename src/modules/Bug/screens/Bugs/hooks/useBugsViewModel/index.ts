import type { IFilingPlan } from '@/modules/Bug/types';
import type { IssueTarget } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUG_FILTER_KEYS, BUG_FILTERS } from '@/modules/Bug/constants';
import { useBugFiling } from '@/modules/Bug/hooks/useBugFiling';
import { appearancesOf } from '@/modules/Bug/library';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useToTop } from '@/shared/hooks/useToTop';
import { useWorkspaceStore } from '@/store';

export const useBugsViewModel = () => {
  const { t } = useTranslation();
  const { topRef, isToTopShown, onToTop } = useToTop();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    bugs: opened.bugs,
    runs: opened.runs,
    plan: opened.plan,
  }));
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const bugFilter = useWorkspaceStore((state) => state.bugFilter);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const setBugFilter = useWorkspaceStore((state) => state.setBugFilter);
  const dismissBug = useWorkspaceStore((state) => state.dismissBug);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
  const [sendingBugId, setSendingBugId] = useState<string | null>(null);
  const filings = useBugFiling();

  const bugs = workspace?.bugs ?? [];
  const runs = workspace?.runs ?? [];
  const plan = workspace?.plan ?? [];
  const open = bugs.filter(({ isDismissed }) => !isDismissed);
  const dismissed = bugs.filter(({ isDismissed }) => isDismissed);
  const filter = bugFilter === 'dismissed' && dismissed.length === 0 ? 'all' : bugFilter;
  const shown =
    filter === 'dismissed'
      ? dismissed
      : filter === 'all'
        ? open
        : open.filter(({ severity }) => severity === filter);

  const onOpenRun = (runId: string) => {
    selectRun(runId);
    selectTab('runs');
  };

  const onOpenCase = (caseId: string) => {
    selectTab('plan');

    if (useWorkspaceStore.getState().openCaseId !== caseId) toggleCase(caseId);
  };

  const sendingBug = bugs.find(({ id }) => id === sendingBugId) ?? null;
  const { filing } = filings;
  const filingBug = bugs.find(({ id }) => id === filing?.bugId) ?? null;

  return {
    topRef,
    isToTopShown,
    onToTop,
    bugs: shown.map((bug) => {
      const latest =
        appearancesOf(bug).findLast((seen) => runs.some(({ id }) => id === seen.runId)) ??
        null;
      const run = runs.find(({ id }) => id === latest?.runId);
      const video = run?.video ?? null;

      return {
        bug,
        hasRun: run !== undefined,
        hasCase: plan.some(({ id }) => id === bug.caseId),
        lastRunId: latest?.runId ?? bug.runId,
        moment:
          workspace === null || latest === null || video === null || latest.at === null
            ? null
            : {
                workspaceId: workspace.id,
                runId: latest.runId,
                atMs: Math.max(0, latest.at - video.startedAt),
              },
      };
    }),
    workspaceId: workspace?.id ?? '',
    openBugId,
    filters: BUG_FILTERS.filter((id) => id !== 'dismissed' || dismissed.length > 0).map(
      (id) => ({
        id,
        label: t(BUG_FILTER_KEYS[id]),
        isActive: id === filter,
      }),
    ),
    isEmpty: bugs.length === 0,
    summary:
      open.length === 0
        ? t('BUG.SUMMARY_NONE')
        : open.length === 1
          ? t('BUG.SUMMARY_ONE')
          : t('BUG.SUMMARY_OTHER', { count: open.length }),
    onDismiss: (props: { bugId: string; isDismissed: boolean }) => {
      if (workspace !== null) dismissBug({ workspaceId: workspace.id, ...props });
    },
    onToggleBug: toggleBug,
    onFilter: setBugFilter,
    onOpenRun,
    onOpenCase,
    sending:
      workspace === null || sendingBug === null
        ? null
        : { workspaceId: workspace.id, bug: sendingBug },
    onSend: setSendingBugId,
    onCancelSend: () => {
      setSendingBugId(null);
    },
    onSendTo: (props: { target: IssueTarget; title: string; plan: IFilingPlan }) => {
      if (workspace === null || sendingBug === null) return;

      filings.start({ workspaceId: workspace.id, bugId: sendingBug.id, ...props });
      setSendingBugId(null);
    },
    filing: filing === null || filingBug === null ? null : { filing, bug: filingBug },
    onCloseFiling: filings.close,
    onRetryFiling: filings.retry,
  };
};
