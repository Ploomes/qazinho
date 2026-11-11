import type { BugFilter, IBug, IFilingPlan } from '@/modules/Bug/types';
import type { IssueTarget } from '@/shared/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUG_FILTER_KEYS, BUG_FILTERS } from '@/modules/Bug/constants';
import { useBugFiling } from '@/modules/Bug/hooks/useBugFiling';
import { appearancesOf } from '@/modules/Bug/library';
import { BUGS_LIST } from '@/modules/Bug/screens/Bugs/constants';
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
  const inTab = (tab: BugFilter) =>
    bugs.filter((bug) =>
      tab === 'dismissed'
        ? bug.isDismissed
        : tab === 'filed'
          ? !bug.isDismissed && bug.filed !== null
          : !bug.isDismissed && bug.filed === null,
    );
  const open = inTab('open');
  const filed = inTab('filed');
  const tabs = BUG_FILTERS.filter((id) => id === 'open' || inTab(id).length > 0);
  const filter = tabs.includes(bugFilter) ? bugFilter : 'open';
  const shown = inTab(filter);
  const openBug = bugs.find(({ id }) => id === openBugId) ?? null;

  const onOpenRun = (runId: string) => {
    selectRun(runId);
    selectTab('runs');
  };

  const onOpenCase = (caseId: string) => {
    selectTab('plan');

    if (useWorkspaceStore.getState().openCaseId !== caseId) toggleCase(caseId);
  };

  const pageOf = (bug: IBug) => {
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
  };

  const sendingBug = bugs.find(({ id }) => id === sendingBugId) ?? null;
  const { filing } = filings;
  const filingBug = bugs.find(({ id }) => id === filing?.bugId) ?? null;

  return {
    topRef,
    isToTopShown,
    onToTop,
    style: {
      '--bug-thumb-width': `${String(BUGS_LIST.thumbWidthPx)}px`,
    } as CSSProperties,
    rows: shown.map((bug) => {
      const hero = bug.shots.find(({ isBad }) => isBad) ?? bug.shots[0] ?? null;

      return {
        id: bug.id,
        title: bug.title,
        thumb: { src: hero?.src ?? null, file: hero?.file ?? null },
        where: t('BUG.ROW_WHERE', { step: bug.stepNumber, caseId: bug.caseId }),
        seen:
          bug.seenRuns > 1
            ? t('BUG.ROW_SEEN_OTHER', { count: bug.seenRuns })
            : t('BUG.ROW_SEEN_ONE'),
        when: bug.runWhen,
        onOpen: () => {
          toggleBug(bug.id);
        },
      };
    }),
    page: openBug === null ? null : pageOf(openBug),
    onBack: () => {
      if (openBug !== null) toggleBug(openBug.id);
    },
    workspaceId: workspace?.id ?? '',
    tabs: tabs.map((id) => ({
      id,
      label: t(BUG_FILTER_KEYS[id]),
      count: id === 'open' && open.length > 0 ? String(open.length) : null,
      isActive: id === filter,
      className: id === filter ? 'bugs__tab bugs__tab--active' : 'bugs__tab',
      onClick: () => {
        setBugFilter(id);
      },
    })),
    isEmpty: bugs.length === 0,
    summary: [
      open.length === 0
        ? t('BUG.LIST_OPEN_NONE')
        : open.length === 1
          ? t('BUG.LIST_OPEN_ONE')
          : t('BUG.LIST_OPEN_OTHER', { count: open.length }),
      ...(filed.length === 0
        ? []
        : [
            filed.length === 1
              ? t('BUG.LIST_FILED_ONE')
              : t('BUG.LIST_FILED_OTHER', { count: filed.length }),
          ]),
    ].join(' '),
    emptyTab: t('BUG.SUMMARY_NONE'),
    onDismiss: (props: { bugId: string; isDismissed: boolean }) => {
      if (workspace !== null) dismissBug({ workspaceId: workspace.id, ...props });
    },
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
