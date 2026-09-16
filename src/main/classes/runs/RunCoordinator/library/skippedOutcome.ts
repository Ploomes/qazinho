import type { IFlatStep, IStepOutcome } from '@/types';

/** A step nobody walked, because the one before it in the same case did not hold up. */
export function skippedOutcome(props: {
  step: IFlatStep;
  index: number;
  workspaceId: string;
}): IStepOutcome {
  const { step, index, workspaceId } = props;

  return {
    workspaceId,
    caseId: step.caseId,
    stepNumber: step.numberInCase,
    index,
    action: step.action,
    expected: step.expected,
    verdict: 'skipped',
    why: 'Skipped because the step before it did not hold up.',
    got: '',
    title: '',
    severity: 'medium',
    tookMs: 0,
    screenshot: null,
    shotFile: null,
  };
}
