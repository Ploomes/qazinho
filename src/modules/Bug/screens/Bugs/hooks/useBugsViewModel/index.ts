import { useTranslation } from 'react-i18next';
import { BUG_FILTERS } from '@/modules/Bug/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useBugsViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const bugFilter = useWorkspaceStore((state) => state.bugFilter);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const setBugFilter = useWorkspaceStore((state) => state.setBugFilter);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const bugs = workspace?.bugs ?? [];
  const shown =
    bugFilter === 'all' ? bugs : bugs.filter(({ severity }) => severity === bugFilter);

  const onOpenRun = () => {
    selectTab('runs');
  };

  const onOpenCase = () => {
    selectTab('plan');
  };

  return {
    bugs: shown,
    openBugId,
    filters: BUG_FILTERS,
    filter: bugFilter,
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
