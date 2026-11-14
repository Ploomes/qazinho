import { useTranslation } from 'react-i18next';
import {
  flattenPlanSteps,
  planStageOf,
  runToContinueOf,
  useRunActions,
} from '@/modules/Run';
import { NO_CASES } from '@/modules/Workspace/screens/Workspace/constants';
import { EXPLORATION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore, useWorkspaceStore } from '@/store';

export const usePlanActionsViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    plan: opened.plan,
    stepCount: flattenPlanSteps(opened.plan).length,
    isLive: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    isByHand: opened.live?.mode === 'manual',
    toContinue:
      runToContinueOf({ plan: opened.plan, runs: opened.runs })?.caseIds.length ?? 0,
    waitsFor: opened.storyStage === 'ahead' ? (opened.issue?.key ?? null) : null,
    projectId: opened.projectId,
    targetId: opened.targetId,
  }));
  const hasApp = useAppStore((state) =>
    state.projects.some(
      ({ id, targets }) =>
        id === workspace?.projectId &&
        targets.some((target) => target.id === workspace.targetId),
    ),
  );
  const openProjectSection = useAppStore((state) => state.openProjectSection);
  const developedIds = useWorkspaceStore(
    (state) => state.developedCases[workspace?.id ?? ''] ?? NO_CASES,
  );
  const { onRun, onRunPlan, onRunDeveloped, onRunWithAgent, onExplore, onPause, onStop } =
    useRunActions();

  const isLive = workspace?.isLive === true;
  const isPaused = workspace?.isPaused === true;
  const hasSteps = (workspace?.stepCount ?? 0) > 0;
  const stage = planStageOf({ plan: workspace?.plan ?? [], developed: developedIds });
  const toContinue = workspace?.toContinue ?? 0;

  return {
    hasWorkspace: workspace !== null,
    isLive,
    canPause: isLive && workspace?.isByHand !== true,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    stopLabel: t('COMMON.STOP'),
    canRun: hasSteps && !isLive,
    canRunWithAgent:
      hasSteps && !isLive && (stage.developed.length > 0 || toContinue > 0),
    developedCount: stage.developed.length,
    toDevelopCount: stage.toDevelop.length,
    toContinueCount: toContinue,
    waitsFor: workspace?.waitsFor ?? null,
    needsApp: workspace !== null && !hasApp,
    onPickApp: () => {
      if (workspace !== null)
        openProjectSection({ projectId: workspace.projectId, section: 'general' });
    },
    canExplore: workspace !== null && !isLive && hasApp,
    exploreLabel: t('WORKSPACE.EXPLORE'),
    exploreTip: t('WORKSPACE.EXPLORE_TIP', { minutes: EXPLORATION.minutes }),
    onRun,
    onRunPlan,
    onRunDeveloped,
    onRunWithAgent,
    onExplore,
    onPause,
    onStop,
  };
};
