import type { IWorkspace } from '@/modules/Workspace';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useSelectedWorkspacePart = <T extends object>(
  pick: (workspace: IWorkspace) => T,
): T | null => {
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);

  return useWorkspaceStore(
    useShallow((state) => {
      const workspace = state.workspaces.find(({ id }) => id === selectedWorkspaceId);

      return workspace === undefined ? null : pick(workspace);
    }),
  );
};
