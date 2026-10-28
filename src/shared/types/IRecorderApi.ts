import type { IRecordingChunk } from './IRecordingChunk';
import type { IRecordingDone } from './IRecordingDone';
import type { IRecordingStart } from './IRecordingStart';
import type { IRecordingStop } from './IRecordingStop';

/**
 * O que o preload dá à janela escondida do gravador como `window.qazinhoRecorder`: o que
 * gravar, e para onde vão os bytes.
 */
export interface IRecorderApi {
  onStart: (listener: (start: IRecordingStart) => void) => () => void;
  onStop: (listener: (stop: IRecordingStop) => void) => () => void;
  write: (chunk: IRecordingChunk) => Promise<void>;
  done: (done: IRecordingDone) => void;
}
