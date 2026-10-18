import { useTranslation } from 'react-i18next';
import { flattenPlanSteps, useRunActions } from '@/modules/Run';
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
  }));
  const tab = useWorkspaceStore((state) => state.tab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const { onRun, onPause, onStop } = useRunActions();

  const isLive = workspace?.isLive === true;
  const isPaused = workspace?.isPaused === true;

  return {
    hasWorkspace: workspace !== null,
    tab,
    name: workspace?.name ?? '',
    issueKey: workspace?.issueKey ?? null,
    status: workspace?.status ?? 'idle',
    statusLabel: isLive
      ? t('WORKSPACE.LIVE_STEP', {
          current: workspace?.walked ?? 0,
          total: workspace?.stepCount ?? 0,
        })
      : null,
    planCount: workspace?.planCount ?? 0,
    runCount: workspace?.runCount ?? 0,
    bugCount: workspace?.bugCount ?? 0,
    canRun: (workspace?.stepCount ?? 0) > 0 && !isLive,
    isLive,
    isPaused,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    onSelectTab: selectTab,
    onRename: (name: string) => {
      if (workspace) renameWorkspace({ workspaceId: workspace.id, name });
    },
    onRun,
    onPause,
    onStop,
  };
};
