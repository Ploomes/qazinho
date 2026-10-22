import type { IFilingPlan } from '@/modules/Bug/types';
import type { IssueTarget } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUG_FILTER_KEYS, BUG_FILTERS } from '@/modules/Bug/constants';
import { useBugFiling } from '@/modules/Bug/hooks/useBugFiling';
import { appearancesOf } from '@/modules/Bug/library';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useWorkspaceStore } from '@/store';

export const useBugsViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    bugs: opened.bugs,
    runs: opened.runs,
  }));
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const bugFilter = useWorkspaceStore((state) => state.bugFilter);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const setBugFilter = useWorkspaceStore((state) => state.setBugFilter);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const [sendingBugId, setSendingBugId] = useState<string | null>(null);
  const filings = useBugFiling();

  const bugs = workspace?.bugs ?? [];
  const runs = workspace?.runs ?? [];
  const shown =
    bugFilter === 'all' ? bugs : bugs.filter(({ severity }) => severity === bugFilter);

  const onOpenRun = (runId: string) => {
    selectRun(runId);
    selectTab('runs');
  };

  const onOpenCase = () => {
    selectTab('plan');
  };

  const sendingBug = bugs.find(({ id }) => id === sendingBugId) ?? null;
  const { filing } = filings;
  const filingBug = bugs.find(({ id }) => id === filing?.bugId) ?? null;

  return {
    bugs: shown.map((bug) => {
      const latest =
        appearancesOf(bug).findLast((seen) => runs.some(({ id }) => id === seen.runId)) ??
        null;
      const run = runs.find(({ id }) => id === latest?.runId);
      const video = run?.video ?? null;

      return {
        bug,
        hasRun: run !== undefined,
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
    openBugId,
    filters: BUG_FILTERS.map((id) => ({
      id,
      label: t(BUG_FILTER_KEYS[id]),
      isActive: id === bugFilter,
    })),
    isEmpty: bugs.length === 0,
    summary:
      bugs.length === 1
        ? t('BUG.SUMMARY_ONE')
        : t('BUG.SUMMARY_OTHER', { count: bugs.length }),
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
