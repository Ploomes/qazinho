import type { IReplayMoment, IReplayTimeline } from '@/modules/Run/types';

/**
 * O caso e o passo que um momento do vídeo mostra: o último de cada começado até ali, e
 * se esse caso já terminou.
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
