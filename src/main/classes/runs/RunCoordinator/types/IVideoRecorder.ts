import type { IRunVideo } from '@/shared/types';

/** What a run needs from whoever records its device: start from the live stream, and stop with the video written, or none. */
export interface IVideoRecorder {
  start: (props: { workspaceId: string; runId: string; url: string }) => Promise<void>;
  stop: (workspaceId: string) => Promise<IRunVideo | null>;
}
