import type { NameOrigin } from '@/modules/Project/types';
import { namingWorkspaceOf } from '@/modules/Project/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useNameProject = () => {
  const nameProject = useAppStore((state) => state.nameProject);
  const landProjectName = useWorkspaceStore((state) => state.landProjectName);

  return (props: {
    projectId: string;
    name: string;
    from: NameOrigin;
    workspaceId?: string;
  }) => {
    const { projectId, from } = props;
    const name = props.name.trim();

    if (!nameProject({ projectId, name })) return;

    const workspaceId =
      props.workspaceId ??
      namingWorkspaceOf({
        workspaces: useWorkspaceStore.getState().workspaces,
        projectId,
        selectedId: useAppStore.getState().selectedWorkspaceId,
      });

    if (workspaceId !== null) {
      landProjectName({ workspaceId, named: { projectId, name, from } });
    }
  };
};
