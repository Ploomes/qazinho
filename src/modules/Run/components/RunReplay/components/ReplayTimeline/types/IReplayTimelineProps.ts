import type { IReplaySpan, IReplayTimeline } from '@/modules/Run/types';
import type { MotionValue } from 'motion/react';

export interface IReplayTimelineProps {
  timeline: IReplayTimeline;
  progress: MotionValue<number>;
  currentMs: number;
  take: IReplaySpan | null;
  flashBugId: string | null;
  faults: number[];
  url: string | null;
  onSeek: (ms: number) => void;
  onScrub: (isScrubbing: boolean) => void;
}
