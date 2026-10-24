import type { ISidebarSuiteRow, SidebarRow } from '@/app/components/Sidebar/types';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_STATUS } from '@/app/components/Sidebar/constants';
import { PRO_SYNC_STATES } from '@/modules/Pro';
import { workspaceMeta } from '@/modules/Workspace';
import { Agent, Archive, Run } from '@/services';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useSuiteStore,
  useWorkspaceStore,
} from '@/store';

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
  const openAutomation = useAppStore((state) => state.openAutomation);
  const screen = useAppStore((state) => state.screen);
  const automationProjectId = useAppStore((state) => state.automationProjectId);
  const suites = useSuiteStore((state) => state.suites);
  const suiteLists = useSuiteStore((state) => state.lists);
  const suiteRuns = useSuiteStore((state) => state.runs);
  const suiteLive = useSuiteStore((state) => state.live);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const removingWorkspaceId = useWorkspaceStore((state) => state.removingWorkspaceId);
  const askRemoveWorkspace = useWorkspaceStore((state) => state.askRemoveWorkspace);
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const isShut = useSettingsStore((state) => state.isSidebarShut);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);
  const shares = useProStore((state) => state.shares);
  const proStatus = useProStore((state) => state.status);

  const syncOf = (projectId: string) => {
    const share = shares.find((one) => one.projectId === projectId);

    if (share === undefined || share.orgSlug === null) return null;

    const shown = PRO_SYNC_STATES[share.state];
    const org =
      proStatus?.isSignedIn === true
        ? (proStatus.orgs.find(({ slug }) => slug === share.orgSlug)?.name ??
          share.orgSlug)
        : share.orgSlug;

    return {
      icon: shown.icon,
      label: t('SIDEBAR.PRO_SYNC', { org, state: t(shown.labelKey) }),
      className: `sidebar__project-sync sidebar__project-sync--${shown.tone}`,
    };
  };

  const suiteRowsOf = (projectId: string): ISidebarSuiteRow[] => {
    const suite = suites[projectId];

    if (suite === undefined) return [];

    const latest = suiteRuns[projectId]?.[0];
    const list = suiteLists[projectId];
    const isGoing = suiteLive[projectId] !== undefined;
    const shown = isGoing
      ? ('running' as const)
      : latest === undefined
        ? ('idle' as const)
        : latest.status === 'broke'
          ? ('attention' as const)
          : latest.status;

    return [
      {
        kind: 'suite',
        id: `suite-${projectId}`,
        projectId,
        name: t('SIDEBAR.SUITE'),
        meta:
          isGoing && latest !== undefined
            ? t('SIDEBAR.SUITE_RUNNING', {
                done: latest.results.length,
                total: latest.total,
              })
            : list?.kind !== 'listed'
              ? suite.name
              : list.tests.length === 1
                ? t('SIDEBAR.SUITE_TESTS_ONE')
                : t('SIDEBAR.SUITE_TESTS_OTHER', { count: list.tests.length }),
        icon: SIDEBAR_STATUS[shown].icon,
        statusLabel: t(STATUS[shown].labelKey),
        tone: SIDEBAR_STATUS[shown].tone,
        animation: SIDEBAR_STATUS[shown].animation,
        isSelected: screen === 'automation' && automationProjectId === projectId,
      },
    ];
  };

  const rows: SidebarRow[] = projects.flatMap((project) => [
    {
      kind: 'header' as const,
      id: `header-${project.id}`,
      projectId: project.id,
      name: project.name,
      sync: syncOf(project.id),
    },
    ...workspaces
      .filter((workspace) => workspace.projectId === project.id)
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
      })),
    ...suiteRowsOf(project.id),
    { kind: 'add' as const, id: `add-${project.id}`, projectId: project.id },
  ]);

  const waiting =
    workspaces.find(
      ({ live }) => live !== null && !live.isDone && live.question !== undefined,
    ) ?? null;

  const onNewProject = useCallback(() => openModal('project'), [openModal]);

  const onRemoveWorkspace = (workspaceId: string) => {
    Run.stop(workspaceId);
    void Agent.stop(workspaceId);
    removeWorkspace(workspaceId);
    Archive.removeWorkspace(workspaceId);

    if (workspaceId === selectedWorkspaceId) goHome();
  };

  return {
    className: isShut ? 'sidebar sidebar--shut' : 'sidebar',
    isShut,
    toggleLabel: t(isShut ? 'SIDEBAR.OPEN' : 'SIDEBAR.SHUT'),
    onToggle: toggleSidebar,
    hasTips: isShut,
    rows,
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
    onOpenSuite: openAutomation,
  };
};
