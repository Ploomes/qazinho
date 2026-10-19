import type { IRecordingChunk } from './IRecordingChunk';
import type { IRecordingDone } from './IRecordingDone';
import type { IRecordingStart } from './IRecordingStart';
import type { IRecordingStop } from './IRecordingStop';

/** What the preload gives the hidden recorder window as `window.qazinhoRecorder`: what to record, and where its bytes go. */
export interface IRecorderApi {
  onStart: (listener: (start: IRecordingStart) => void) => () => void;
  onStop: (listener: (stop: IRecordingStop) => void) => () => void;
  write: (chunk: IRecordingChunk) => Promise<void>;
  done: (done: IRecordingDone) => void;
}
