import type { ITestCase } from '@/modules/Plan/types';
import { useCallback } from 'react';
import { flattenPlanSteps } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const usePlanViewModel = () => {
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const openCaseId = useWorkspaceStore((state) => state.openCaseId);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
  const reorderPlan = useWorkspaceStore((state) => state.reorderPlan);
  const startRun = useWorkspaceStore((state) => state.startRun);
  const stopRun = useWorkspaceStore((state) => state.stopRun);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const plan = workspace?.plan ?? [];
  const live = workspace?.live ?? null;
  const isLocked = live !== null && live.isRunning;

  const onReorder = useCallback(
    (cases: ITestCase[]) => {
      if (workspace && !isLocked) reorderPlan({ workspaceId: workspace.id, plan: cases });
    },
    [isLocked, reorderPlan, workspace],
  );

  const onRunAll = useCallback(() => {
    if (workspace) startRun(workspace.id);
  }, [startRun, workspace]);

  const onStop = useCallback(() => {
    if (workspace) stopRun(workspace.id);
  }, [stopRun, workspace]);

  const onDraftInChat = useCallback(() => {
    selectTab('chat');
  }, [selectTab]);

  return {
    plan,
    openCaseId,
    isLocked,
    isEmpty: plan.length === 0,
    summary: `${String(plan.length)} cases · ${String(flattenPlanSteps(plan).length)} steps`,
    onToggleCase: toggleCase,
    onReorder,
    onRunAll,
    onStop,
    onDraftInChat,
  };
};
