import type { IRunVideo } from './IRunVideo';

/** A recording written to its end, or `null` when no frame ever came or the encoder broke. */
export interface IRecordingDone {
  id: string;
  video: IRunVideo | null;
}
