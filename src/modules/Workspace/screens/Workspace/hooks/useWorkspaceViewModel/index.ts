import { useTranslation } from 'react-i18next';
import { caseVerdict, flattenPlanSteps, useRunActions } from '@/modules/Run';
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
    isLive: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    hasPassed: opened.runs.some((run) =>
      run.cases.some(({ steps }) => caseVerdict(steps) === 'passed'),
    ),
  }));
  const tab = useWorkspaceStore((state) => state.tab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const { onRun, onRunWithAgent, onPause, onStop } = useRunActions();

  const isLive = workspace?.isLive === true;
  const isPaused = workspace?.isPaused === true;

  return {
    hasWorkspace: workspace !== null,
    tab,
    name: workspace?.name ?? '',
    issueKey: workspace?.issueKey ?? null,
    status: workspace?.status ?? 'idle',
    liveStatus: isPaused ? ('paused' as const) : ('running' as const),
    statusLabel: isLive
      ? t(isPaused ? 'WORKSPACE.PAUSED_STEP' : 'WORKSPACE.LIVE_STEP', {
          current: Math.min((workspace?.walked ?? 0) + 1, workspace?.stepCount ?? 0),
          total: workspace?.stepCount ?? 0,
        })
      : null,
    planCount: workspace?.planCount ?? 0,
    runCount: workspace?.runCount ?? 0,
    bugCount: workspace?.bugCount ?? 0,
    canRun: (workspace?.stepCount ?? 0) > 0 && !isLive,
    canRunWithAgent:
      (workspace?.stepCount ?? 0) > 0 && !isLive && workspace?.hasPassed === true,
    runWithAgentTip: t('WORKSPACE.RUN_WITH_AGENT_TIP'),
    isLive,
    isPaused,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    onSelectTab: selectTab,
    onRename: (name: string) => {
      if (workspace) renameWorkspace({ workspaceId: workspace.id, name });
    },
    onRun,
    onRunWithAgent,
    onPause,
    onStop,
  };
};
