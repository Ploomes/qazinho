import type { IStripLook } from './IStripLook';
import type { IStripWords } from './IStripWords';
import type { IReplayRequest } from '@/modules/Run/types';

/** What a composition needs: the run's MP4, its requests on the video, how long the video runs, and how the strip looks and reads. */
export interface IComposeReplay {
  video: Uint8Array;
  requests: IReplayRequest[];
  isShowingFiles: boolean;
  durationMs: number;
  look: IStripLook;
  words: IStripWords;
  onProgress: (share: number) => void;
  signal: AbortSignal;
}
