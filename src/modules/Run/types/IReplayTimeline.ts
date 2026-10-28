import type { IReplayChapter } from './IReplayChapter';
import type { IReplayMark } from './IReplayMark';

/** O vídeo de uma run disposto: a duração, um capítulo por caso, e uma marca por bug. */
export interface IReplayTimeline {
  durationMs: number;
  chapters: IReplayChapter[];
  marks: IReplayMark[];
}
