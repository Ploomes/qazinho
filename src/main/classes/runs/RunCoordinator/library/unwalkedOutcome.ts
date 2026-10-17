import type { IFlatStep, IStepOutcome } from '@/types';

/** A step with no verdict of the agent's own: skipped after a step that failed, or never reported. */
export function unwalkedOutcome(props: {
  step: IFlatStep;
  index: number;
  workspaceId: string;
  verdict: 'skipped' | 'blocked';
  why: string;
}): IStepOutcome {
  const { step, index, workspaceId, verdict, why } = props;

  return {
    workspaceId,
    caseId: step.caseId,
    stepNumber: step.numberInCase,
    index,
    action: step.action,
    expected: step.expected,
    verdict,
    why,
    got: '',
    title: '',
    severity: 'medium',
    tookMs: 0,
    screenshot: null,
    shotFile: null,
  };
}
