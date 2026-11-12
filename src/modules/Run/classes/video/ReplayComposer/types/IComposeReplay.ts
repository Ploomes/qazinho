import type { IStripLook } from './IStripLook';
import type { IStripWords } from './IStripWords';
import type { IReplayRequest } from '@/modules/Run/types';

/**
 * O que uma composição precisa: o MP4 da run, os pedidos dela no vídeo, quanto o vídeo
 * dura, e como a faixa se parece e se lê.
 */
export interface IComposeReplay {
  video: Uint8Array;
  requests: IReplayRequest[];
  isShowingAll: boolean;
  durationMs: number;
  look: IStripLook;
  words: IStripWords;
  onProgress: (share: number) => void;
  signal: AbortSignal;
}
