import type {
  ISidebarProBadge,
  ISidebarProjectGroup,
  SidebarGroupRow,
} from '@/app/components/Sidebar/types';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_SIZE, SIDEBAR_STATUS } from '@/app/components/Sidebar/constants';
import { workspaceMeta } from '@/modules/Workspace';
import { Agent, Archive, Run } from '@/services';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { useAppStore, useProStore, useSettingsStore, useWorkspaceStore } from '@/store';

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
  const openProSettings = useAppStore((state) => state.openProSettings);
  const shares = useProStore((state) => state.shares);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const removingWorkspaceId = useWorkspaceStore((state) => state.removingWorkspaceId);
  const askRemoveWorkspace = useWorkspaceStore((state) => state.askRemoveWorkspace);
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const isShut = useSettingsStore((state) => state.isSidebarShut);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);

  const selectedProjectId =
    workspaces.find((workspace) => workspace.id === selectedWorkspaceId)?.projectId ??
    null;

  const [filter, setFilter] = useState('');
  const [expansions, setExpansions] = useState<Record<string, boolean>>({});
  const filterRef = useRef<HTMLInputElement>(null);

  const query = isShut ? '' : filter.trim().toLowerCase();

  const isRevealedByFilter = (projectId: string) =>
    query !== '' &&
    workspaces.some(
      (workspace) =>
        workspace.projectId === projectId && workspace.name.toLowerCase().includes(query),
    );

  const isProjectExpanded = (projectId: string) =>
    expansions[projectId] ??
    (projectId === selectedProjectId || isRevealedByFilter(projectId));

  useEffect(() => {
    if (isShut) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const editing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement);

      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || editing)
        return;

      event.preventDefault();
      filterRef.current?.focus();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isShut]);

  const proBadgeOf = (project: { id: string; name: string }): ISidebarProBadge | null => {
    const share = shares.find(({ projectId }) => projectId === project.id);

    if (share === undefined || share.orgSlug === null) return null;

    const pending = share.pending.length;
    const updates = share.conflicts.length;

    return {
      label: t('SIDEBAR.PRO_LINK', { name: project.name }),
      tip: [
        ...(pending > 0 ? [t('SIDEBAR.PRO_PENDING', { count: pending })] : []),
        ...(updates > 0 ? [t('SIDEBAR.PRO_UPDATES', { count: updates })] : []),
      ].join(' · '),
      pending,
      updates,
      hasPending: pending > 0,
      hasUpdates: updates > 0,
    };
  };

  const groups: ISidebarProjectGroup[] = projects.flatMap((project) => {
    const projectWorkspaces = workspaces.filter(
      (workspace) => workspace.projectId === project.id,
    );
    const projectMatches = query === '' || project.name.toLowerCase().includes(query);
    const matchingWorkspaces = projectWorkspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(query),
    );

    if (query !== '' && !projectMatches && matchingWorkspaces.length === 0) return [];

    const shownWorkspaces = projectMatches ? projectWorkspaces : matchingWorkspaces;

    const workspaceRows: SidebarGroupRow[] = shownWorkspaces
      .map((workspace) => ({
        workspace,
        shown:
          workspace.live === null || workspace.live.isDone
            ? workspace.status
            : workspace.live.question !== undefined
              ? ('attention' as const)
              : !workspace.live.isRunning
                ? ('paused' as const)
                : workspace.status,
      }))
      .sort((a, b) => Number(b.shown === 'attention') - Number(a.shown === 'attention'))
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
        isWaiting: shown === 'attention',
        isRemoving: workspace.id === removingWorkspaceId,
      }));

    return [
      {
        id: `group-${project.id}`,
        projectId: project.id,
        name: project.name,
        initial: project.name.charAt(0).toUpperCase(),
        isSelected: project.id === selectedProjectId,
        isExpanded: isProjectExpanded(project.id),
        meta: String(projectWorkspaces.length),
        pro: proBadgeOf(project),
        rows: [
          ...workspaceRows,
          { kind: 'add' as const, id: `add-${project.id}`, projectId: project.id },
        ],
      },
    ];
  });

  const waiting =
    workspaces.find(
      ({ live }) => live !== null && !live.isDone && live.question !== undefined,
    ) ?? null;

  const onNewProject = () => openModal('project');

  const onSelectProject = (projectId: string) => {
    const first = workspaces.find((workspace) => workspace.projectId === projectId);

    if (first !== undefined) selectWorkspace(first.id);
    else openWorkspaceModal(projectId);
  };

  const onToggleProject = (projectId: string) => {
    setExpansions((current) => ({
      ...current,
      [projectId]: !isProjectExpanded(projectId),
    }));
  };

  const onRemoveWorkspace = (workspaceId: string) => {
    Run.stop(workspaceId);
    void Agent.stop(workspaceId);
    removeWorkspace(workspaceId);
    Archive.removeWorkspace(workspaceId);

    if (workspaceId === selectedWorkspaceId) goHome();
  };

  return {
    className: isShut ? 'sidebar sidebar--shut' : 'sidebar',
    style: {
      '--sidebar-tile': `${String(SIDEBAR_SIZE.tile)}px`,
      '--sidebar-field': `${String(SIDEBAR_SIZE.field)}px`,
      '--sidebar-avatar': `${String(SIDEBAR_SIZE.avatar)}px`,
      '--sidebar-lead': `${String(SIDEBAR_SIZE.lead)}px`,
    } as CSSProperties,
    isShut,
    toggleLabel: t(isShut ? 'SIDEBAR.OPEN' : 'SIDEBAR.SHUT'),
    onToggle: toggleSidebar,
    hasTips: isShut,
    onSelectProject,
    filter,
    filterRef,
    onFilterChange: setFilter,
    groups,
    emptyLabel:
      groups.length === 0 && query !== ''
        ? t('SIDEBAR.FILTER_EMPTY', { query: filter.trim() })
        : null,
    onToggleProject,
    waitingName: waiting?.name ?? null,
    onOpenWaiting: () => {
      if (waiting === null) return;

      selectWorkspace(waiting.id);
      selectTab('chat');
    },
    onSelectWorkspace: selectWorkspace,
    onNewWorkspace: openWorkspaceModal,
    onNewProject,
    onSettings: openSettings,
    onAskRemove: askRemoveWorkspace,
    onRemoveWorkspace,
    onProjectSettings: openProjectSettings,
    onProSettings: openProSettings,
  };
};
