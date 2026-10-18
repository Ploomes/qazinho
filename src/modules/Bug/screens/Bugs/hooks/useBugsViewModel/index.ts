import { useTranslation } from 'react-i18next';
import { BUG_FILTER_KEYS, BUG_FILTERS } from '@/modules/Bug/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useWorkspaceStore } from '@/store';

export const useBugsViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    bugs: opened.bugs,
    runs: opened.runs,
  }));
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const bugFilter = useWorkspaceStore((state) => state.bugFilter);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const setBugFilter = useWorkspaceStore((state) => state.setBugFilter);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const selectRun = useWorkspaceStore((state) => state.selectRun);

  const bugs = workspace?.bugs ?? [];
  const runIds = new Set((workspace?.runs ?? []).map(({ id }) => id));
  const shown =
    bugFilter === 'all' ? bugs : bugs.filter(({ severity }) => severity === bugFilter);

  const onOpenRun = (runId: string) => {
    selectRun(runId);
    selectTab('runs');
  };

  const onOpenCase = () => {
    selectTab('plan');
  };

  return {
    bugs: shown.map((bug) => ({ bug, hasRun: runIds.has(bug.runId) })),
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
  };
};
