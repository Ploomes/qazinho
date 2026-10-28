import type { IRunVideo } from '@/shared/types';

/**
 * O que uma run precisa de quem grava o dispositivo dela: começar a partir do stream
 * vivo, e parar com o vídeo escrito, ou nenhum.
 */
export interface IVideoRecorder {
  start: (props: { workspaceId: string; runId: string; url: string }) => Promise<void>;
  stop: (workspaceId: string) => Promise<IRunVideo | null>;
}
