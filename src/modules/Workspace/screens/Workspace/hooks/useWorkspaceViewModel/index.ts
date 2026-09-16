import { flattenPlanSteps } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';
import { useCallback } from 'react';

export const useWorkspaceViewModel = () => {
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const tab = useWorkspaceStore((state) => state.tab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const startRun = useWorkspaceStore((state) => state.startRun);
  const pauseRun = useWorkspaceStore((state) => state.pauseRun);
  const stopRun = useWorkspaceStore((state) => state.stopRun);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const steps = flattenPlanSteps(workspace?.plan ?? []);
  const live = workspace?.live ?? null;
  const isLive = live !== null && !live.isDone;

  const onRun = useCallback(() => {
    if (workspace) startRun(workspace.id);
  }, [startRun, workspace]);

  const onPause = useCallback(() => {
    if (workspace) pauseRun(workspace.id);
  }, [pauseRun, workspace]);

  const onStop = useCallback(() => {
    if (workspace) stopRun(workspace.id);
  }, [stopRun, workspace]);

  return {
    workspace,
    tab,
    name: workspace?.name ?? '',
    issueKey: workspace?.issue?.key ?? null,
    status: workspace?.status ?? 'idle',
    statusLabel: isLive
      ? `running · step ${String(live.stepIndex)} of ${String(steps.length)}`
      : (workspace?.status ?? 'idle'),
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
