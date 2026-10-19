import type { Severity } from '@/shared/types';

/** A bug the agent saw while it walked a step, that the step itself does not ask about. */
export interface IStepFinding {
  title: string;
  severity: Severity;
  expected: string;
  got: string;
}
