import type { IRun } from '@/modules/Run/types';
import type { ILiveRun } from '@/modules/Workspace/types';
import type { IFlatStep, StepVerdict } from '@/shared/types';

/**
 * O que cada passo do plano guarda: a run em andamento, ou senão a última run que o
 * andou; pendente onde nenhuma andou.
 */
export function stepVerdictsOf(props: {
  steps: IFlatStep[];
  live: ILiveRun | null;
  lastRun: IRun | null;
}): StepVerdict[] {
  const { steps, live, lastRun } = props;

  return steps.map((step, index) => {
    if (live !== null)
      return (
        live.outcomes.find((outcome) => outcome.index === index)?.verdict ??
        (live.doingIndex === index ? 'running' : 'pending')
      );

    return (
      lastRun?.cases
        .find(({ id }) => id === step.caseId)
        ?.steps.find(({ number }) => number === step.numberInCase)?.verdict ?? 'pending'
    );
  });
}
