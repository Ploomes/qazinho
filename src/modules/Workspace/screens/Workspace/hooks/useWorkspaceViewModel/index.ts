import { useTranslation } from 'react-i18next';
import { caseVerdict, flattenPlanSteps, useRunActions } from '@/modules/Run';
import { EXPLORATION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useWorkspaceStore } from '@/store';

export const useWorkspaceViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    name: opened.name,
    issueKey: opened.issue?.key ?? null,
    status: opened.status,
    planCount: opened.plan.length,
    runCount: opened.runs.length,
    bugCount: opened.bugs.length,
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
  const tab = useWorkspaceStore((state) => state.tab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const { onRun, onRunWithAgent, onExplore, onPause, onStop } = useRunActions();

  const isLive = workspace?.isLive === true;
  const isPaused = workspace?.isPaused === true;
  const isAsking = workspace?.isAsking === true;

  return {
    hasWorkspace: workspace !== null,
    tab,
    name: workspace?.name ?? '',
    issueKey: workspace?.issueKey ?? null,
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
    planCount: workspace?.planCount ?? 0,
    runCount: workspace?.runCount ?? 0,
    bugCount: workspace?.bugCount ?? 0,
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
    onRun,
    onRunWithAgent,
    onExplore,
    onPause,
    onStop,
  };
};
