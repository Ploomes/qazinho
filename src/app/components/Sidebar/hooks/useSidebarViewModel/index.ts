import type { SidebarRow } from '@/app/components/Sidebar/types';
import { useCallback } from 'react';
import { SIDEBAR_STATUS } from '@/app/components/Sidebar/constants';
import { workspaceMeta } from '@/modules/Workspace/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useSidebarViewModel = () => {
  const projects = useAppStore((state) => state.projects);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const openModal = useAppStore((state) => state.openModal);
  const openWorkspaceModal = useAppStore((state) => state.openWorkspaceModal);
  const openSettings = useAppStore((state) => state.openSettings);
  const workspaces = useWorkspaceStore((state) => state.workspaces);

  const rows: SidebarRow[] = projects.flatMap((project) => [
    { kind: 'header' as const, id: `header-${project.id}`, name: project.name },
    ...workspaces
      .filter((workspace) => workspace.projectId === project.id)
      .map((workspace) => ({
        kind: 'workspace' as const,
        id: workspace.id,
        name: workspace.name,
        meta: workspaceMeta(workspace),
        glyph: SIDEBAR_STATUS[workspace.status].glyph,
        tone: SIDEBAR_STATUS[workspace.status].tone,
        animation: SIDEBAR_STATUS[workspace.status].animation,
        isSelected: workspace.id === selectedWorkspaceId,
        isWaiting: workspace.status === 'attention',
      })),
    { kind: 'add' as const, id: `add-${project.id}`, projectId: project.id },
  ]);

  const waiting =
    workspaces.find((workspace) => workspace.status === 'attention') ?? null;

  const onNewProject = useCallback(() => openModal('project'), [openModal]);

  return {
    rows,
    waitingName: waiting?.name ?? null,
    onSelectWorkspace: selectWorkspace,
    onNewWorkspace: openWorkspaceModal,
    onNewProject,
    onSettings: openSettings,
  };
};
