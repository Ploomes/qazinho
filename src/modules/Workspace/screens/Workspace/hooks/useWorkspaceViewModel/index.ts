import { useTranslation } from 'react-i18next';
import { flattenPlanSteps } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useWorkspaceViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const tab = useWorkspaceStore((state) => state.tab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const startRun = useWorkspaceStore((state) => state.startRun);
  const pauseRun = useWorkspaceStore((state) => state.pauseRun);
  const stopRun = useWorkspaceStore((state) => state.stopRun);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const workspaceId = workspace?.id ?? null;
  const steps = flattenPlanSteps(workspace?.plan ?? []);
  const live = workspace?.live ?? null;
  const isLive = live !== null && !live.isDone;

  const onRun = () => {
    if (workspaceId !== null) startRun(workspaceId);
  };

  const onPause = () => {
    if (workspaceId !== null) pauseRun(workspaceId);
  };

  const onStop = () => {
    if (workspaceId !== null) stopRun(workspaceId);
  };

  return {
    workspace,
    tab,
    name: workspace?.name ?? '',
    issueKey: workspace?.issue?.key ?? null,
    status: workspace?.status ?? 'idle',
    statusLabel: isLive
      ? t('WORKSPACE.LIVE_STEP', { current: live.stepIndex, total: steps.length })
      : null,
    planCount: workspace?.plan.length ?? 0,
    runCount: workspace?.runs.length ?? 0,
    bugCount: workspace?.bugs.length ?? 0,
    canRun: steps.length > 0 && !isLive,
    isLive,
    isPaused: live?.isRunning === false && !live.isDone,
    onSelectTab: selectTab,
    onRun,
    onPause,
    onStop,
  };
};
