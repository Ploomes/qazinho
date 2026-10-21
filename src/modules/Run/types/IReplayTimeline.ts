import type { IReplayChapter } from './IReplayChapter';
import type { IReplayMark } from './IReplayMark';

/** A run's video laid out: its length, a chapter per case, and a mark per bug. */
export interface IReplayTimeline {
  durationMs: number;
  chapters: IReplayChapter[];
  marks: IReplayMark[];
}
