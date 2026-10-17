import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { IRunCase } from '@/modules/Run';
import { useTranslation } from 'react-i18next';
import {
  addCase,
  addStep,
  editCase,
  editStep,
  removeCase,
  removeStep,
} from '@/modules/Plan/library';
import { useRunControls, flattenPlanSteps } from '@/modules/Run';
import { useAppStore, useWorkspaceStore } from '@/store';

export const usePlanViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const openCaseId = useWorkspaceStore((state) => state.openCaseId);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { onRun, onStop } = useRunControls();

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const workspaceId = workspace?.id ?? null;
  const plan = workspace?.plan ?? [];
  const isLocked = workspace?.live?.isRunning === true;

  const write = (cases: ITestCase[]) => {
    if (workspaceId === null || isLocked) return;

    setPlan({ workspaceId, plan: cases });
  };

  const latest = workspace?.runs[0] ?? null;
  const lastRuns: Record<string, IRunCase> = Object.fromEntries(
    (latest?.cases ?? []).map((runCase) => [runCase.id, runCase]),
  );

  return {
    plan,
    lastRuns,
    openCaseId,
    isLocked,
    isEmpty: plan.length === 0,
    summary: t('PLAN.SUMMARY', {
      cases: plan.length,
      steps: flattenPlanSteps(plan).length,
    }),
    onToggleCase: toggleCase,
    onReorder: write,
    onRunAll: onRun,
    onStop,
    onDraftInChat: () => {
      selectTab('chat');
    },
    onAddCase: () => {
      write(addCase(plan));
    },
    onRemoveCase: (caseId: string) => {
      write(removeCase({ plan, caseId }));
    },
    onEditCase: (props: { caseId: string; fields: Partial<ITestCase> }) => {
      write(editCase({ plan, ...props }));
    },
    onAddStep: (caseId: string) => {
      write(addStep({ plan, caseId }));
    },
    onRemoveStep: (props: { caseId: string; index: number }) => {
      write(removeStep({ plan, ...props }));
    },
    onEditStep: (props: { caseId: string; index: number; step: Partial<ITestStep> }) => {
      write(editStep({ plan, ...props }));
    },
  };
};
