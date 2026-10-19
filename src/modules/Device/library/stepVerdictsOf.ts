import type { IRun } from '@/modules/Run/types';
import type { ILiveRun } from '@/modules/Workspace/types';
import type { IFlatStep, StepVerdict } from '@/shared/types';

/** What each step of the plan holds: the run going, or else the last run that walked it; pending where none did. */
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
