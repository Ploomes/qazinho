import type { IRunVideo } from '@/shared/types';
import type { FileHandle } from 'node:fs/promises';

/** A recording under way: the file its bytes go to, the writes still landing, and how it ends. */
export interface IOpenRecording {
  id: string;
  file: string;
  handle: FileHandle;
  writes: Promise<void>;
  done: Promise<IRunVideo | null>;
  settle: (video: IRunVideo | null) => void;
}
