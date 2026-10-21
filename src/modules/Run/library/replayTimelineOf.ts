import type { IBug } from '@/modules/Bug/types';
import type { IReplayTimeline, IRun } from '@/modules/Run/types';
import { appearancesOf } from '@/modules/Bug/library';

/** A run's video laid out as chapters and marks, each placed by when it happened; null for a run with no recording. */
export function replayTimelineOf(props: {
  run: IRun;
  bugs: IBug[];
}): IReplayTimeline | null {
  const { run, bugs } = props;
  const { video } = run;

  if (video === null) return null;

  const offset = (at: number) =>
    Math.min(video.durationMs, Math.max(0, at - video.startedAt));

  const chapters = run.cases.flatMap((runCase) => {
    const steps = runCase.steps.flatMap((step) =>
      step.span === null
        ? []
        : [
            {
              number: step.number,
              action: step.action,
              verdict: step.verdict,
              bugId: step.bugId,
              fromMs: offset(step.span.from),
              toMs: offset(step.span.to),
            },
          ],
    );

    if (steps.length === 0) return [];

    return [
      {
        caseId: runCase.id,
        title: runCase.title,
        verdict: runCase.verdict,
        fromMs: Math.min(...steps.map(({ fromMs }) => fromMs)),
        toMs: Math.max(...steps.map(({ toMs }) => toMs)),
        steps,
      },
    ];
  });

  return {
    durationMs: video.durationMs,
    chapters,
    marks: bugs.flatMap((bug) =>
      appearancesOf(bug).flatMap((seen) =>
        seen.runId !== run.id || seen.at === null
          ? []
          : [
              {
                bugId: bug.id,
                title: bug.title,
                severity: bug.severity,
                atMs: offset(seen.at),
                caseId: seen.caseId,
                stepNumber: seen.stepNumber,
              },
            ],
      ),
    ),
  };
}
