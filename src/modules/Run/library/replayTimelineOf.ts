import type { IBug } from '@/modules/Bug/types';
import type { IReplayStep, IReplayTimeline, IRun } from '@/modules/Run/types';
import { appearancesOf } from '@/modules/Bug/library';

/**
 * O vídeo de uma run em capítulos e marcas; numa exploração, cada tela vale da anotação
 * dela até a próxima. Null para uma run sem gravação.
 */
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
    const placed = runCase.steps.flatMap((step) =>
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
    const steps =
      run.kind === 'explore'
        ? screensOf({ notes: placed, endMs: video.durationMs })
        : placed;

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

function screensOf(props: { notes: IReplayStep[]; endMs: number }): IReplayStep[] {
  const notes = [...props.notes].sort((one, other) => one.toMs - other.toMs);

  return notes.map((note, at) => ({
    ...note,
    fromMs: at === 0 ? note.fromMs : note.toMs,
    toMs: notes[at + 1]?.toMs ?? props.endMs,
  }));
}
