import type { IReplayMoment, IReplayTimeline } from '@/modules/Run/types';

export interface IReplayLogProps {
  timeline: IReplayTimeline;
  moment: IReplayMoment;
  onSeek: (ms: number) => void;
}
