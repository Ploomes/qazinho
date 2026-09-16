import type { ITestCase } from '@/modules/Plan/types';
import { useTranslation } from 'react-i18next';
import { flattenPlanSteps } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const usePlanViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const openCaseId = useWorkspaceStore((state) => state.openCaseId);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
  const reorderPlan = useWorkspaceStore((state) => state.reorderPlan);
  const startRun = useWorkspaceStore((state) => state.startRun);
  const stopRun = useWorkspaceStore((state) => state.stopRun);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const workspaceId = workspace?.id ?? null;
  const plan = workspace?.plan ?? [];
  const isLocked = workspace?.live?.isRunning === true;

  const onReorder = (cases: ITestCase[]) => {
    if (workspaceId === null || isLocked) return;

    reorderPlan({ workspaceId, plan: cases });
  };

  const onRunAll = () => {
    if (workspaceId !== null) startRun(workspaceId);
  };

  const onStop = () => {
    if (workspaceId !== null) stopRun(workspaceId);
  };

  const onDraftInChat = () => {
    selectTab('chat');
  };

  return {
    plan,
    openCaseId,
    isLocked,
    isEmpty: plan.length === 0,
    summary: t('PLAN.SUMMARY', {
      cases: plan.length,
      steps: flattenPlanSteps(plan).length,
    }),
    onToggleCase: toggleCase,
    onReorder,
    onRunAll,
    onStop,
    onDraftInChat,
  };
};
