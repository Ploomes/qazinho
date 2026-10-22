import type { IRunRef } from '@/shared/types';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useOpenRun = () => {
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const selectRun = useWorkspaceStore((state) => state.selectRun);

  return (run: IRunRef) => {
    const live = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === run.workspaceId)?.live;

    selectWorkspace(run.workspaceId);

    if (live?.id === run.runId && !live.isDone) {
      selectTab('chat');

      return;
    }

    selectTab('runs');
    selectRun(run.runId);
  };
};
