import type { IReplaySpan, IReplayTimeline, ReplayFocus } from '@/modules/Run/types';
import { REPLAY } from '@/modules/Run/constants';

/**
 * The stretch of the video a focus plays: a case whole, or a bug from a little before it
 * to a little after its step ended.
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
