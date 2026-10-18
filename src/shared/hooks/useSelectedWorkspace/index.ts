import type { IWorkspace } from '@/modules/Workspace';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useSelectedWorkspace = (): IWorkspace | null => {
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);

  return useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null,
  );
};
