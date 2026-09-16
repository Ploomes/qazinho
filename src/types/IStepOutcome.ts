import type { StepVerdict } from './StepVerdict';

/** What a run reports about one step, once the device has been driven and looked at. */
export interface IStepOutcome {
  workspaceId: string;
  caseId: string;
  stepNumber: number;
  index: number;
  action: string;
  verdict: StepVerdict;
  why: string;
  got: string;
  screenshot: string | null;
}
