import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { caseVerdict, flattenPlanSteps, useRunActions } from '@/modules/Run';
import { panelWidthOf } from '@/modules/Workspace/library';
import { EXPLORATION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useSidebarWidth } from '@/shared/hooks/useSidebarWidth';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useWorkspaceStore } from '@/store';

export const useWorkspaceViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    name: opened.name,
    issue: opened.issue,
    design: opened.design,
    status: opened.status,
    stepCount: flattenPlanSteps(opened.plan).length,
    walked: opened.live?.outcomes.length ?? 0,
    isExploring: opened.live?.kind === 'explore',
    isLive: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    isAsking: opened.live?.question !== undefined && opened.live.isDone === false,
    hasPassed: opened.runs.some((run) =>
      run.cases.some(({ steps }) => caseVerdict(steps) === 'passed'),
    ),
  }));
  const isHidden = useWorkspaceStore((state) => state.isPanelWide);
  const isPanelOpen = useWorkspaceStore((state) => state.isPanelOpen);
  const panelWidth = useWorkspaceStore((state) => state.panelWidth);
  const windowWidth = useWindowWidth();
  const sidebarWidth = useSidebarWidth();
  const panel = panelWidthOf({
    width: panelWidth,
    windowWidth,
    isOpen: isPanelOpen,
    isWide: false,
    sidebarWidth,
  });
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const setDesign = useWorkspaceStore((state) => state.setDesign);
  const { onRun, onRunWithAgent, onExplore, onPause, onStop } = useRunActions();

  const isLive = workspace?.isLive === true;
  const isPaused = workspace?.isPaused === true;
  const isAsking = workspace?.isAsking === true;

  return {
    hasWorkspace: workspace !== null,
    isHidden,
    className: isHidden ? 'workspace workspace--hidden' : 'workspace',
    style: {
      '--chat-rest': `${String(windowWidth - sidebarWidth - panel.outer)}px`,
    } as CSSProperties,
    name: workspace?.name ?? '',
    issue:
      workspace?.issue === null || workspace?.issue === undefined
        ? null
        : {
            key: workspace.issue.key,
            url: workspace.issue.url,
            title: workspace.issue.title,
          },
    design:
      workspace?.design === null || workspace?.design === undefined
        ? null
        : {
            name: workspace.design.name,
            url: workspace.design.url,
            title: t('WORKSPACE.DESIGN_OPEN'),
          },
    dropDesignLabel: t('WORKSPACE.DESIGN_DROP'),
    status: workspace?.status ?? 'idle',
    liveStatus: isAsking
      ? ('attention' as const)
      : isPaused
        ? ('paused' as const)
        : ('running' as const),
    statusLabel: !isLive
      ? null
      : workspace?.isExploring === true
        ? t(
            isAsking
              ? 'WORKSPACE.ASKED_EXPLORING'
              : isPaused
                ? 'WORKSPACE.PAUSED_EXPLORING'
                : 'WORKSPACE.LIVE_EXPLORING',
            {
              screens:
                workspace.walked === 1
                  ? t('CHAT.EXPLORE_SCREENS_ONE')
                  : t('CHAT.EXPLORE_SCREENS_OTHER', { count: workspace.walked }),
            },
          )
        : t(
            isAsking
              ? 'WORKSPACE.ASKED_STEP'
              : isPaused
                ? 'WORKSPACE.PAUSED_STEP'
                : 'WORKSPACE.LIVE_STEP',
            {
              current: Math.min((workspace?.walked ?? 0) + 1, workspace?.stepCount ?? 0),
              total: workspace?.stepCount ?? 0,
            },
          ),
    canRun: (workspace?.stepCount ?? 0) > 0 && !isLive,
    canRunWithAgent:
      (workspace?.stepCount ?? 0) > 0 && !isLive && workspace?.hasPassed === true,
    canExplore: workspace !== null && !isLive,
    exploreTip: t('WORKSPACE.EXPLORE_TIP', { minutes: EXPLORATION.minutes }),
    isLive,
    isPaused,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    onRename: (name: string) => {
      if (workspace) renameWorkspace({ workspaceId: workspace.id, name });
    },
    onDropDesign: () => {
      if (workspace) setDesign({ workspaceId: workspace.id, design: null });
    },
    onRun,
    onRunWithAgent,
    onExplore,
    onPause,
    onStop,
  };
};
