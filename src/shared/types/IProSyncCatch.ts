/** One time a bug was caught, as it goes to QAzinho Pro: the run and when it started, the step, its screen as a file in the archive, and its moment in seconds into that run's video. */
export interface IProSyncCatch {
  runId: string;
  runWhen: string;
  caseId: string;
  stepNumber: number;
  shotFile: string | null;
  at: number | null;
}
