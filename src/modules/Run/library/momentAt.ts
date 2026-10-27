import type { IReplayMoment, IReplayTimeline } from '@/modules/Run/types';

/**
 * The case and step a moment of the video shows: the last of each begun by then, and
 * whether that case already ended.
 */
export function momentAt(props: {
  timeline: IReplayTimeline;
  ms: number;
}): IReplayMoment {
  const { timeline, ms } = props;
  const chapterIndex = timeline.chapters.findLastIndex(({ fromMs }) => fromMs <= ms);
  const chapter = timeline.chapters[chapterIndex];

  if (chapter === undefined) return { chapterIndex: -1, stepIndex: -1, isBetween: false };

  return {
    chapterIndex,
    stepIndex: chapter.steps.findLastIndex(({ fromMs }) => fromMs <= ms),
    isBetween: ms > chapter.toMs,
  };
}
