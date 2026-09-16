import type { StepVerdict } from './StepVerdict';

/** What a run reports about one step: `screenshot` is inline because the page cannot read disk. */
export interface IStepOutcome {
  workspaceId: string;
  caseId: string;
  stepNumber: number;
  index: number;
  action: string;
  expected: string;
  verdict: StepVerdict;
  why: string;
  got: string;
  screenshot: string | null;
  shotFile: string | null;
}
