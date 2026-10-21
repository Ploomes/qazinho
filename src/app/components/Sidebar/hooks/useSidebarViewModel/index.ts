import type { SidebarRow } from '@/app/components/Sidebar/types';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_STATUS } from '@/app/components/Sidebar/constants';
import { workspaceMeta } from '@/modules/Workspace';
import { Agent, Archive, Run } from '@/services';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useSidebarViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const openModal = useAppStore((state) => state.openModal);
  const openWorkspaceModal = useAppStore((state) => state.openWorkspaceModal);
  const openSettings = useAppStore((state) => state.openSettings);
  const goHome = useAppStore((state) => state.goHome);
  const openProjectSettings = useAppStore((state) => state.openProjectSettings);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const removingWorkspaceId = useWorkspaceStore((state) => state.removingWorkspaceId);
  const askRemoveWorkspace = useWorkspaceStore((state) => state.askRemoveWorkspace);
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace);

  const rows: SidebarRow[] = projects.flatMap((project) => [
    {
      kind: 'header' as const,
      id: `header-${project.id}`,
      projectId: project.id,
      name: project.name,
    },
    ...workspaces
      .filter((workspace) => workspace.projectId === project.id)
      .map((workspace) => ({
        workspace,
        shown:
          workspace.live !== null && !workspace.live.isDone && !workspace.live.isRunning
            ? ('paused' as const)
            : workspace.status,
      }))
      .map(({ workspace, shown }) => ({
        kind: 'workspace' as const,
        id: workspace.id,
        name: workspace.name,
        platform:
          project.targets.find(({ id }) => id === workspace.targetId)?.kind ?? null,
        meta: t(workspaceMeta(workspace).key as never, {
          count: workspaceMeta(workspace).count,
          current: workspace.live?.outcomes.length ?? 0,
        }),
        icon: SIDEBAR_STATUS[shown].icon,
        statusLabel: t(STATUS[shown].labelKey),
        tone: SIDEBAR_STATUS[shown].tone,
        animation: SIDEBAR_STATUS[shown].animation,
        isSelected: workspace.id === selectedWorkspaceId,
        isWaiting: workspace.status === 'attention',
        isRemoving: workspace.id === removingWorkspaceId,
      })),
    { kind: 'add' as const, id: `add-${project.id}`, projectId: project.id },
  ]);

  const waiting =
    workspaces.find((workspace) => workspace.status === 'attention') ?? null;

  const onNewProject = useCallback(() => openModal('project'), [openModal]);

  const onRemoveWorkspace = (workspaceId: string) => {
    Run.stop(workspaceId);
    void Agent.stop(workspaceId);
    removeWorkspace(workspaceId);
    Archive.removeWorkspace(workspaceId);

    if (workspaceId === selectedWorkspaceId) goHome();
  };

  return {
    rows,
    waitingName: waiting?.name ?? null,
    onSelectWorkspace: selectWorkspace,
    onNewWorkspace: openWorkspaceModal,
    onNewProject,
    onSettings: openSettings,
    onAskRemove: askRemoveWorkspace,
    onRemoveWorkspace,
    onProjectSettings: openProjectSettings,
  };
};
