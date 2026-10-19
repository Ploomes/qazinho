import type { ICaseRemoval } from '@/modules/Plan/screens/Plan/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { IRunCase } from '@/modules/Run';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addCase,
  addStep,
  caseIdsUsed,
  editCase,
  editStep,
  removeCase,
  removeStep,
} from '@/modules/Plan/library';
import { flattenPlanSteps, useRunActions } from '@/modules/Run';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useSettingsStore, useWorkspaceStore } from '@/store';

export const usePlanViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    plan: opened.plan,
    isLocked: opened.live !== null && !opened.live.isDone,
    latest: opened.runs[0] ?? null,
    runs: opened.runs,
    bugs: opened.bugs,
  }));
  const openCaseId = useWorkspaceStore((state) => state.openCaseId);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const agent = useSettingsStore((state) => state.agent);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { onRun, onStop } = useRunActions();
  const [removal, setRemoval] = useState<ICaseRemoval | null>(null);

  const workspaceId = workspace?.id ?? null;
  const plan = workspace?.plan ?? [];
  const isLocked = workspace?.isLocked === true;

  const write = (cases: ITestCase[]) => {
    if (workspaceId === null || isLocked) return;

    setPlan({ workspaceId, plan: cases });
  };

  const undoable =
    removal !== null &&
    removal.workspaceId === workspaceId &&
    removal.after === plan &&
    !isLocked
      ? removal
      : null;
  const latest = workspace?.latest ?? null;
  const stepCount = flattenPlanSteps(plan).length;
  const lastRuns: Record<string, IRunCase> = Object.fromEntries(
    (latest?.cases ?? []).map((runCase) => [runCase.id, runCase]),
  );

  return {
    plan,
    lastRuns,
    openCaseId,
    isLocked,
    lockedLabel: t('PLAN.LOCKED', { agent }),
    isEmpty: plan.length === 0,
    summary: t('PLAN.SUMMARY', {
      cases:
        plan.length === 1
          ? t('PLAN.CASES_ONE')
          : t('PLAN.CASES_OTHER', { count: plan.length }),
      steps:
        stepCount === 1
          ? t('PLAN.STEPS_ONE')
          : t('PLAN.STEPS_OTHER', { count: stepCount }),
    }),
    onToggleCase: toggleCase,
    onReorder: write,
    onRunAll: onRun,
    onStop,
    onDraftInChat: () => {
      selectTab('chat');
    },
    onAddCase: () => {
      write(
        addCase({
          plan,
          used: caseIdsUsed({
            plan,
            runs: workspace?.runs ?? [],
            bugs: workspace?.bugs ?? [],
          }),
        }),
      );
    },
    undo:
      undoable === null
        ? null
        : {
            key: undoable.key,
            text: t('PLAN.CASE_REMOVED', { id: undoable.caseId }),
            actionLabel: t('PLAN.UNDO'),
          },
    onRemoveCase: (caseId: string) => {
      if (workspaceId === null || isLocked) return;

      const after = removeCase({ plan, caseId });

      write(after);
      setRemoval({
        key: `${caseId}@${String(Date.now())}`,
        workspaceId,
        caseId,
        before: plan,
        after,
      });
    },
    onUndo: () => {
      if (undoable === null) return;

      write(undoable.before);
      setRemoval(null);
    },
    onUndoExpire: () => {
      setRemoval(null);
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
