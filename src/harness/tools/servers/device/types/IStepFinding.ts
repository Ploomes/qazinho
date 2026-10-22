import type { Severity } from '@/shared/types';

/** A bug the agent saw while it walked a step, that the step itself does not ask about; `sameAs` names the bug already open it is, and `frame` the Figma frame the screen differs from. */
export interface IStepFinding {
  title: string;
  severity: Severity;
  expected: string;
  got: string;
  sameAs?: string;
  frame?: string;
}
