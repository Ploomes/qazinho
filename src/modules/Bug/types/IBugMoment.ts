/** Where a bug sits in its run's video: the run, and how far into the video it was caught, in ms. */
export interface IBugMoment {
  workspaceId: string;
  runId: string;
  atMs: number;
}
