import type { IRunRef } from './IRunRef';

/**
 * O vídeo que vai com um bug: um clipe que a página cortou do MP4 da run, ou a gravação
 * inteira da run quando nenhum pôde ser cortado.
 */
export type BugVideo =
  | { kind: 'clip'; name: string; data: Uint8Array }
  | { kind: 'recording'; name: string; run: IRunRef };
