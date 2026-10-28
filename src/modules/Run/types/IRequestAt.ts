import type { IReplayRequest } from './IReplayRequest';

/**
 * Um pedido como um momento do vídeo o mostra: terminado ou ainda esperando, e por quanto
 * tempo até ali.
 */
export interface IRequestAt {
  request: IReplayRequest;
  isDone: boolean;
  elapsedMs: number;
}
