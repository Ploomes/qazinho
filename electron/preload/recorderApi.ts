import type {
  IRecorderApi,
  IRecordingChunk,
  IRecordingDone,
  IRecordingStart,
  IRecordingStop,
} from '@/shared/types';
import { ipcRenderer } from 'electron';
import { CHANNELS } from '@/shared/constants';

export const recorderApi: IRecorderApi = {
  onStart: (listener: (start: IRecordingStart) => void) => {
    const forward = (_: unknown, start: IRecordingStart) => {
      listener(start);
    };

    ipcRenderer.on(CHANNELS.recorderStart, forward);

    return () => {
      ipcRenderer.off(CHANNELS.recorderStart, forward);
    };
  },
  onStop: (listener: (stop: IRecordingStop) => void) => {
    const forward = (_: unknown, stop: IRecordingStop) => {
      listener(stop);
    };

    ipcRenderer.on(CHANNELS.recorderStop, forward);

    return () => {
      ipcRenderer.off(CHANNELS.recorderStop, forward);
    };
  },
  write: (chunk: IRecordingChunk) =>
    ipcRenderer.invoke(CHANNELS.recorderWrite, chunk) as Promise<void>,
  done: (done: IRecordingDone) => {
    ipcRenderer.send(CHANNELS.recorderDone, done);
  },
};
