import { useRunActions } from '@/modules/Run/hooks/useRunActions';
import { flattenPlanSteps } from '@/modules/Run/library';
import { useSelectedWorkspace } from '@/shared/hooks/useSelectedWorkspace';

export const useRunControls = () => {
  const workspace = useSelectedWorkspace();
  const actions = useRunActions();

  const steps = flattenPlanSteps(workspace?.plan ?? []);
  const live = workspace?.live ?? null;
  const isLive = live !== null && !live.isDone;

  return {
    steps,
    live,
    isLive,
    isPaused: live !== null && !live.isRunning && !live.isDone,
    canRun: steps.length > 0 && !isLive,
    ...actions,
  };
};
