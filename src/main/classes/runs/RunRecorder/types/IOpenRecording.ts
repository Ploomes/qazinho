import type { IRunVideo } from '@/shared/types';
import type { FileHandle } from 'node:fs/promises';

/**
 * Uma gravação em andamento: o arquivo para onde vão os bytes, as escritas ainda
 * chegando, e como ela termina.
 */
export interface IOpenRecording {
  id: string;
  file: string;
  handle: FileHandle;
  writes: Promise<void>;
  done: Promise<IRunVideo | null>;
  settle: (video: IRunVideo | null) => void;
}
