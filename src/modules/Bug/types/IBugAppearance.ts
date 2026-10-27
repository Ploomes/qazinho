/**
 * One time a bug was caught: the run and when it started, the step it was walking, and
 * when in the run's video.
 */
export interface IBugAppearance {
  runId: string;
  runWhen: string;
  caseId: string;
  stepNumber: number;
  at: number | null;
}
