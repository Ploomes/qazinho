import type { Severity } from './Severity';
import type { StepVerdict } from './StepVerdict';

/** What a run reports about one step: `screenshot` is inline because the page cannot read disk, and `at` is when it came, in epoch ms. */
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
  title: string;
  severity: Severity;
  tookMs: number;
  at: number;
  screenshot: string | null;
  shotFile: string | null;
}
