/**
 * When something in a run began and ended, in epoch ms, so it finds its place in the
 * run's video.
 */
export interface IRunSpan {
  from: number;
  to: number;
}
