import type { IRunRef } from '@/shared/types';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useOpenRun = () => {
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const selectRun = useWorkspaceStore((state) => state.selectRun);

  return (run: IRunRef) => {
    selectWorkspace(run.workspaceId);
    selectTab('runs');
    selectRun(run.runId);
  };
};
