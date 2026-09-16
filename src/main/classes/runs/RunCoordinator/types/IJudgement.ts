import type { Severity, StepVerdict } from '@/types';

/** The agent's answer about one step, once it has been read back into something trustworthy. */
export interface IJudgement {
  verdict: StepVerdict;
  why: string;
  got: string;
  title: string;
  severity: Severity;
}
