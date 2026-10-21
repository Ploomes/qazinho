import type { IReplayRequest } from '@/modules/Run/types';

/** The run's requests under its video, at the moment it is at, with the files shown or kept out. */
export interface IReplayNetworkProps {
  requests: IReplayRequest[];
  currentMs: number;
  isShowingFiles: boolean;
  onToggleFiles: () => void;
  onSeek: (ms: number) => void;
}
