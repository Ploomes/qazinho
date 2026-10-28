import type { IRunVideo } from './IRunVideo';

/**
 * Uma gravação escrita até o fim, ou `null` quando nenhum frame veio ou o codificador
 * quebrou.
 */
export interface IRecordingDone {
  id: string;
  video: IRunVideo | null;
}
