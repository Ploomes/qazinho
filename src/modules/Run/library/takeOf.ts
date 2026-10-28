import type { IReplaySpan, IReplayTimeline, ReplayFocus } from '@/modules/Run/types';
import { REPLAY } from '@/modules/Run/constants';

/**
 * O trecho do vídeo que um foco toca: um caso inteiro, ou um bug de um pouco antes dele
 * até um pouco depois de o passo dele terminar.
 */
export function takeOf(props: {
  timeline: IReplayTimeline;
  focus: ReplayFocus;
}): IReplaySpan | null {
  const { timeline, focus } = props;

  if (focus.kind === 'case') {
    const chapter = timeline.chapters.find(({ caseId }) => caseId === focus.caseId);

    return chapter === undefined ? null : { fromMs: chapter.fromMs, toMs: chapter.toMs };
  }

  if (focus.kind === 'bug') {
    const mark = timeline.marks.find(({ bugId }) => bugId === focus.bugId);

    if (mark === undefined) return null;

    const chapter = timeline.chapters.find(({ caseId }) => caseId === mark.caseId);
    const step = chapter?.steps.find(({ number }) => number === mark.stepNumber);

    return {
      fromMs: Math.max(chapter?.fromMs ?? 0, mark.atMs - REPLAY.bugLeadMs),
      toMs: Math.min(
        timeline.durationMs,
        Math.max(mark.atMs, step?.toMs ?? 0) + REPLAY.bugTailMs,
      ),
    };
  }

  return null;
}
