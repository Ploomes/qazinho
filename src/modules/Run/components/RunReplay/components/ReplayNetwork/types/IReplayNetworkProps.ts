import type { IReplayRequest } from '@/modules/Run/types';

/**
 * Os pedidos da run sob o vídeo, no momento em que ele está, com os arquivos mostrados ou
 * deixados de fora.
 */
export interface IReplayNetworkProps {
  requests: IReplayRequest[];
  currentMs: number;
  isShowingFiles: boolean;
  onToggleFiles: () => void;
  onSeek: (ms: number) => void;
}
