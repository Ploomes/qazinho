import type {
  ISidebarFlyout,
  ISidebarFlyoutPlace,
  ISidebarProBadge,
  ISidebarProjectGroup,
  ISidebarWorkspaceRow,
  PlanSignalKind,
  SidebarGroupRow,
} from '@/app/components/Sidebar/types';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SIDEBAR_FLYOUT,
  SIDEBAR_PROJECT_SIGNAL_KEYS,
  SIDEBAR_SIGNAL,
  SIDEBAR_SIZE,
  SIDEBAR_STATUS,
  SIDEBAR_UNDO,
} from '@/app/components/Sidebar/constants';
import { planSignalOf, projectSignalOf } from '@/app/components/Sidebar/library';
import { homeCountOf, homeOf } from '@/modules/Home';
import { projectAppOf, projectMarkOf, useSiteIcons } from '@/modules/Project';
import { RUN_HOW_KEYS } from '@/modules/Run/constants';
import { currentStepOf, runToContinueOf } from '@/modules/Run/library';
import { workspaceMeta } from '@/modules/Workspace';
import { Agent, Archive, Platform, Run } from '@/services';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { comboLabelOf } from '@/shared/hooks/useKeybinds/library';
import { useAppStore, useProStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const useSidebarViewModel = () => {
  const { t, i18n } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const openModal = useAppStore((state) => state.openModal);
  const openWorkspaceModal = useAppStore((state) => state.openWorkspaceModal);
  const openSettings = useAppStore((state) => state.openSettings);
  const goHome = useAppStore((state) => state.goHome);
  const openBugs = useAppStore((state) => state.openBugs);
  const screen = useAppStore((state) => state.screen);
  const forgetPlanMemories = useAppStore((state) => state.forgetPlanMemories);
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

  const icons = useSiteIcons(
    projects.flatMap(({ targets }) => projectAppOf(targets).address ?? []),
  );
  const places = new Intl.ListFormat(i18n.language, { type: 'unit', style: 'short' });

  const [expansions, setExpansions] = useState<Record<string, boolean>>({});
  const [flyoutAt, setFlyoutAt] = useState<ISidebarFlyoutPlace | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSearch = useAppStore((state) => state.openSearch);
  const searchCombo = useSettingsStore(
    (state) => state.keybinds.find(({ id }) => id === 'search')?.combo ?? '',
  );

  const isProjectExpanded = (projectId: string) =>
    expansions[projectId] ?? (!isShut || projectId === selectedProjectId);

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
      ].join(', '),
      pending,
      updates,
      hasPending: pending > 0,
      hasUpdates: updates > 0,
      isShown: pending + updates > 0,
    };
  };

  const groups: ISidebarProjectGroup[] = projects.flatMap((project) => {
    const projectWorkspaces = workspaces.filter(
      (workspace) => workspace.projectId === project.id,
    );
    const shownWorkspaces = projectWorkspaces;
    const app = projectAppOf(project.targets);

    const kinds: (PlanSignalKind | null)[] = [];
    const workspaceRows: ISidebarWorkspaceRow[] = shownWorkspaces
      .map((workspace) => ({
        workspace,
        shown:
          workspace.live === null || workspace.live.isDone
            ? runToContinueOf({ plan: workspace.plan, runs: workspace.runs }) !== null
              ? ('paused' as const)
              : workspace.status
            : workspace.live.question !== undefined
              ? ('attention' as const)
              : !workspace.live.isRunning
                ? ('paused' as const)
                : workspace.status,
      }))
      .sort((a, b) => Number(b.shown === 'attention') - Number(a.shown === 'attention'))
      .map(({ workspace, shown }) => {
        const meta: string = t(workspaceMeta(workspace).key as never, {
          count: workspaceMeta(workspace).count,
          current: currentStepOf({
            walked: workspace.live?.outcomes.length ?? 0,
            total: workspaceMeta(workspace).count,
          }),
        });
        const statusLabel =
          shown === 'running' && workspace.live?.how !== undefined
            ? t(RUN_HOW_KEYS[workspace.live.how])
            : t(STATUS[shown].labelKey);
        const bugs = workspace.bugs.filter(
          ({ isDismissed, filed }) => !isDismissed && filed === null,
        ).length;
        const signal = planSignalOf(shown);

        kinds.push(signal);
        const said =
          signal === null
            ? null
            : {
                asking: t('SIDEBAR.ASKED_YOU'),
                running: t('SIDEBAR.STATUS_META', { status: statusLabel, meta }),
                paused: statusLabel,
                failed:
                  bugs === 0
                    ? statusLabel
                    : t('SIDEBAR.STATUS_META', {
                        status: statusLabel,
                        meta: t(
                          bugs === 1 ? 'SIDEBAR.META_BUG_ONE' : 'SIDEBAR.META_BUG_OTHER',
                          { count: bugs },
                        ),
                      }),
              }[signal];

        return {
          kind: 'workspace' as const,
          id: workspace.id,
          name: workspace.name === '' ? t('WORKSPACE.UNNAMED') : workspace.name,
          platform:
            project.targets.find(({ id }) => id === workspace.targetId)?.kind ?? null,
          meta,
          icon: SIDEBAR_STATUS[shown].icon,
          statusLabel,
          tone: SIDEBAR_STATUS[shown].tone,
          animation: SIDEBAR_STATUS[shown].animation,
          signal:
            signal === null || said === null
              ? null
              : {
                  ...SIDEBAR_SIGNAL[signal],
                  label: said,
                },
          label:
            said === null
              ? workspace.name === ''
                ? t('WORKSPACE.UNNAMED')
                : workspace.name
              : t('SIDEBAR.ROW_LABEL', {
                  name: workspace.name === '' ? t('WORKSPACE.UNNAMED') : workspace.name,
                  status: said,
                }),
          isSelected: workspace.id === selectedWorkspaceId,
          isRemoving: workspace.id === removingWorkspaceId,
        };
      });

    const pro = proBadgeOf(project);
    const addRow: SidebarGroupRow = {
      kind: 'add' as const,
      id: `add-${project.id}`,
      projectId: project.id,
    };
    const projectKind = projectSignalOf(kinds);
    const projectSaid =
      projectKind === null ? '' : t(SIDEBAR_PROJECT_SIGNAL_KEYS[projectKind]);

    return [
      {
        id: `group-${project.id}`,
        projectId: project.id,
        name: project.name,
        initial: project.name.charAt(0).toUpperCase(),
        mark: projectMarkOf({ name: project.name, app, icons }),
        place: places.format(app.places),
        hasPlace: app.places.length > 0,
        tip:
          pro !== null
            ? pro.label
            : app.places.length > 0
              ? t('SIDEBAR.PROJECT_TIP', {
                  name: project.name,
                  place: places.format(app.places),
                })
              : project.name,
        isSelected: project.id === selectedProjectId,
        isExpanded: isProjectExpanded(project.id),
        pro,
        rows: workspaceRows.length > 0 ? workspaceRows : [addRow],
        plans: workspaceRows,
        signal:
          projectKind === null
            ? null
            : { ...SIDEBAR_SIGNAL[projectKind], label: projectSaid },
        railLabel:
          projectKind === null
            ? project.name
            : t('SIDEBAR.ROW_LABEL', { name: project.name, status: projectSaid }),
      },
    ];
  });

  const waiting =
    workspaces.find(
      ({ id, live }) =>
        id !== selectedWorkspaceId &&
        live !== null &&
        !live.isDone &&
        live.question !== undefined,
    ) ?? null;

  const onNewProject = () => openModal('project');

  const onToggleProject = (projectId: string) => {
    setExpansions((current) => ({
      ...current,
      [projectId]: !isProjectExpanded(projectId),
    }));
  };

  useEffect(() => {
    if (removingWorkspaceId === null) return;

    const workspaceId = removingWorkspaceId;
    const timer = setTimeout(() => {
      Run.stop(workspaceId);
      void Agent.stop(workspaceId);
      removeWorkspace(workspaceId);
      forgetPlanMemories(workspaceId);
      Archive.removeWorkspace(workspaceId);

      if (useAppStore.getState().selectedWorkspaceId === workspaceId) goHome();
    }, SIDEBAR_UNDO.holdMs);

    return () => {
      clearTimeout(timer);
    };
  }, [removingWorkspaceId, removeWorkspace, forgetPlanMemories, goHome]);

  const keepFlyout = () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);

    closeTimer.current = null;
  };

  const closeFlyout = () => {
    keepFlyout();
    setFlyoutAt(null);
  };

  useEffect(() => {
    if (flyoutAt === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFlyoutAt(null);
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [flyoutAt]);

  useEffect(
    () => () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    },
    [],
  );

  const flyoutGroup =
    flyoutAt === null || !isShut
      ? null
      : (groups.find(({ projectId }) => projectId === flyoutAt.projectId) ?? null);
  const flyout: ISidebarFlyout | null =
    flyoutAt === null || flyoutGroup === null
      ? null
      : {
          projectId: flyoutGroup.projectId,
          name: flyoutGroup.name,
          place: flyoutGroup.place,
          mark: flyoutGroup.mark,
          plans: flyoutGroup.plans,
          top: flyoutAt.top,
          left: flyoutAt.right + SIDEBAR_FLYOUT.gapPx,
        };

  const bugsCount = workspaces
    .flatMap(({ bugs }) => bugs)
    .filter(({ isDismissed, filed }) => !isDismissed && filed === null).length;

  const homeCount = homeCountOf(
    homeOf({
      projects,
      workspaces,
      developed: {},
      recent: [],
      shown: 0,
      unnamed: '',
    }),
  );

  return {
    className: isShut ? 'sidebar sidebar--shut' : 'sidebar',
    style: {
      '--sidebar-tile': `${String(SIDEBAR_SIZE.tile)}px`,
      '--sidebar-field': `${String(SIDEBAR_SIZE.field)}px`,
      '--sidebar-avatar': `${String(SIDEBAR_SIZE.avatar)}px`,
      '--sidebar-lead': `${String(SIDEBAR_SIZE.lead)}px`,
      '--sidebar-mark': `${String(SIDEBAR_SIZE.mark)}px`,
    } as CSSProperties,
    isShut,
    toggleLabel: t(isShut ? 'SIDEBAR.OPEN' : 'SIDEBAR.SHUT'),
    onToggle: toggleSidebar,
    hasTips: isShut,
    searchLabel: t('SEARCH.LABEL'),
    searchCombo:
      searchCombo === ''
        ? ''
        : comboLabelOf({ combo: searchCombo, isMac: Platform.isMac() }),
    onSearch: openSearch,
    groups,
    onToggleProject,
    waitingName: waiting?.name ?? null,
    onOpenWaiting: () => {
      if (waiting === null) return;

      selectWorkspace(waiting.id);
      selectTab('chat');
    },
    onSelectWorkspace: selectWorkspace,
    onNewWorkspace: openWorkspaceModal,
    bugsLabel: t('BUG.TITLE'),
    isBugs: screen === 'bugs',
    bugsCount: bugsCount === 0 ? null : String(bugsCount),
    onBugs: openBugs,
    onNewProject,
    onSettings: openSettings,
    onAskRemove: askRemoveWorkspace,
    onUndoRemove: () => {
      askRemoveWorkspace(null);
    },
    removedLabel: t('SIDEBAR.REMOVED'),
    undoLabel: t('PLAN.UNDO'),
    onProjectSettings: openProjectSettings,
    onProSettings: openProSettings,
    markSize: SIDEBAR_SIZE.mark,
    railMarkSize: SIDEBAR_SIZE.railMark,
    homeLabel: t('HOME.TITLE'),
    isHome: screen === 'welcome',
    homeCount: homeCount > 0 ? String(homeCount) : null,
    homeTip:
      homeCount > 0
        ? t(homeCount === 1 ? 'SIDEBAR.HOME_COUNT_ONE' : 'SIDEBAR.HOME_COUNT_OTHER', {
            count: homeCount,
          })
        : undefined,
    onHome: goHome,
    flyout,
    newWorkspaceLabel: t('SIDEBAR.NEW_WORKSPACE'),
    projectSettingsLabel: t('COMMON.SETTINGS'),
    onFlyoutOpen: (place: ISidebarFlyoutPlace) => {
      keepFlyout();
      setFlyoutAt(place);
    },
    onFlyoutToggle: (place: ISidebarFlyoutPlace) => {
      keepFlyout();
      setFlyoutAt(flyoutAt?.projectId === place.projectId ? null : place);
    },
    onFlyoutKeep: keepFlyout,
    onFlyoutLeave: () => {
      keepFlyout();
      closeTimer.current = setTimeout(() => {
        setFlyoutAt(null);
      }, SIDEBAR_FLYOUT.closeMs);
    },
    onFlyoutPlan: (workspaceId: string) => {
      closeFlyout();
      selectWorkspace(workspaceId);
    },
    onFlyoutNew: (projectId: string) => {
      closeFlyout();
      openWorkspaceModal(projectId);
    },
    onFlyoutSettings: (projectId: string) => {
      closeFlyout();
      openProjectSettings(projectId);
    },
  };
};
