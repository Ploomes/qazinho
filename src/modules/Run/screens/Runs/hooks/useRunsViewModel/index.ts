import type { RunFilter } from '@/modules/Run/types';
import { filterCases } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';

const FILTERS: RunFilter[] = ['all', 'passed', 'failed', 'blocked', 'skipped'];

export const useRunsViewModel = () => {
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const selectedRunId = useWorkspaceStore((state) => state.selectedRunId);
  const runFilter = useWorkspaceStore((state) => state.runFilter);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const setRunFilter = useWorkspaceStore((state) => state.setRunFilter);
  const openMedia = useAppStore((state) => state.openMedia);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const runs = workspace?.runs ?? [];
  const run = runs.find(({ id }) => id === selectedRunId) ?? runs[0] ?? null;

  const onOpenBug = (bugId: string) => {
    toggleBug(bugId);
    selectTab('bugs');
  };

  const onOpenShot = (label: string) => {
    openMedia({
      kicker: run?.id ?? '',
      title: label,
      isTall: workspace?.planKind === 'mobile',
    });
  };

  return {
    runs,
    run,
    filters: FILTERS,
    filter: runFilter,
    cases: run === null ? [] : filterCases({ cases: run.cases, filter: runFilter }),
    isEmpty: runs.length === 0,
    onSelectRun: selectRun,
    onFilter: setRunFilter,
    onOpenBug,
    onOpenShot,
  };
};
