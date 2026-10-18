import type { StepVerdict } from '@/modules/Run';

/** A step of a run that did not hold up; `runId` is null for one saved before the chat kept runs together. */
export interface IVerdictMessage {
  id: string;
  kind: 'verdict';
  runId: string | null;
  at: string;
  verdict: StepVerdict;
  stepNumber: number;
  action: string;
  expected: string | null;
  got: string | null;
}
