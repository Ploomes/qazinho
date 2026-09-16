import type { StepVerdict } from '@/types';

/** What walking one step leaves behind: the conversation to carry on, and how it went. */
export interface IStepResult {
  session: string | null;
  verdict: StepVerdict;
}
