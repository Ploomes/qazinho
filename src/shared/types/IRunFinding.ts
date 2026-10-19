import type { Severity } from './Severity';

/** A bug the runner filed on the side of a step, with the step it was walking and the screen it saw. */
export interface IRunFinding {
  caseId: string;
  stepNumber: number;
  index: number;
  action: string;
  title: string;
  severity: Severity;
  expected: string;
  got: string;
  screenshot: string | null;
  shotFile: string | null;
}
