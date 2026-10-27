import type { IRunRef } from './IRunRef';

/**
 * The video that goes with a bug: a clip the page cut out of the run's MP4, or the run's
 * whole recording when none could be cut.
 */
export type BugVideo =
  | { kind: 'clip'; name: string; data: Uint8Array }
  | { kind: 'recording'; name: string; run: IRunRef };
