import type { IReplayRequest } from '@/modules/Run/types';

/** Um pedido da run aberto em detalhe, com o caminho até o momento dele no vídeo. */
export interface IRequestDetailProps {
  request: IReplayRequest;
  onSeek: (ms: number) => void;
  onClose: () => void;
}
