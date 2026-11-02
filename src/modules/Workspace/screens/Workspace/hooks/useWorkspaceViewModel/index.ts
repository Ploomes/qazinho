import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  caseVerdict,
  flattenPlanSteps,
  useRunActions,
  walkedStepsOf,
} from '@/modules/Run';
import { WORKSPACE_TABS } from '@/modules/Workspace/screens/Workspace/constants';
import { EXPLORATION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
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
    runStepCount: walkedStepsOf({ plan: opened.plan, caseIds: opened.live?.caseIds })
      .length,
    planCount: opened.plan.length,
    runCount: opened.runs.length,
    bugCount: opened.bugs.filter(({ isDismissed }) => !isDismissed).length,
    walked: opened.live?.outcomes.length ?? 0,
    isExploring: opened.live?.kind === 'explore',
    isLive: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    isAsking: opened.live?.question !== undefined && opened.live.isDone === false,
    hasPassed: opened.runs.some((run) =>
      run.cases.some(({ steps }) => caseVerdict(steps) === 'passed'),
    ),
  }));
  const tab = useWorkspaceStore((state) => state.panelTab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const setDesign = useWorkspaceStore((state) => state.setDesign);
  const { onRun, onRunWithAgent, onExplore, onPause, onStop } = useRunActions();

  const isLive = workspace?.isLive === true;
  const isPaused = workspace?.isPaused === true;
  const isAsking = workspace?.isAsking === true;

  const workspaceId = workspace?.id ?? null;

  useEffect(() => {
    if (isLive) selectTab('device');
  }, [workspaceId, isLive, selectTab]);

  return {
    hasWorkspace: workspace !== null,
    style: {
      '--workspace-tabs': `${String(WORKSPACE_TABS.height)}px`,
    } as CSSProperties,
    tab,
    planCount: workspace?.planCount ?? 0,
    runCount: workspace?.runCount ?? 0,
    bugCount: workspace?.bugCount ?? 0,
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
              current: Math.min(
                (workspace?.walked ?? 0) + 1,
                workspace?.runStepCount ?? 0,
              ),
              total: workspace?.runStepCount ?? 0,
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
    onSelectTab: selectTab,
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
