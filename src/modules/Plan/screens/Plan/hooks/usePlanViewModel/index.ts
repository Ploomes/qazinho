import type { ITestCase } from '@/modules/Plan/types';
import { useTranslation } from 'react-i18next';
import { useRunControls } from '@/modules/Run/hooks';
import { flattenPlanSteps } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const usePlanViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const openCaseId = useWorkspaceStore((state) => state.openCaseId);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
  const reorderPlan = useWorkspaceStore((state) => state.reorderPlan);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { onRun, onStop } = useRunControls();

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const workspaceId = workspace?.id ?? null;
  const plan = workspace?.plan ?? [];
  const isLocked = workspace?.live?.isRunning === true;

  const onReorder = (cases: ITestCase[]) => {
    if (workspaceId === null || isLocked) return;

    reorderPlan({ workspaceId, plan: cases });
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
    onRunAll: onRun,
    onStop,
    onDraftInChat,
  };
};
