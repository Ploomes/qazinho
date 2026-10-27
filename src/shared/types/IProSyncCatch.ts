/**
 * One time a bug was caught, as it goes to the QA's account: the run, step, screen and
 * moment.
 */
export interface IProSyncCatch {
  runId: string;
  runWhen: string;
  caseId: string;
  stepNumber: number;
  shotFile: string | null;
  at: number | null;
}
