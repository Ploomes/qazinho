import type { IBug } from '@/modules/Bug/types';
import type { IRun } from '@/modules/Run/types';
import type { IProSyncBug, IProSyncCatch } from '@/shared/types';
import { sharedValueOf } from './sharedValueOf';
import { startedIsoOf } from './startedIsoOf';
import { videoSecondsOf } from './videoSecondsOf';

/**
 * Um bug como o QAzinho Pro o aceita, visto primeiro quando a run que o pegou começou,
 * cada vez posta no vídeo da run dela; null quando essa run não sabe quando começou.
 */
export function syncedBugOf(props: {
  workspaceId: string;
  bug: IBug;
  runs: IRun[];
}): IProSyncBug | null {
  const { workspaceId, bug, runs } = props;
  const catchOf = (seen: {
    runId: string;
    caseId: string;
    stepNumber: number;
    shotFile: string | null;
    at: number | null;
  }): IProSyncCatch | null => {
    const run = runs.find(({ id }) => id === seen.runId);
    const runWhen = run === undefined ? null : startedIsoOf(run);

    if (run === undefined || runWhen === null) return null;

    return {
      ...seen,
      runWhen,
      at:
        seen.at === null || run.video === null
          ? null
          : videoSecondsOf({ at: seen.at, startedAt: run.video.startedAt }),
    };
  };
  const caught = catchOf({
    runId: bug.runId,
    caseId: bug.caseId,
    stepNumber: bug.stepNumber,
    shotFile: (bug.shots.find(({ isBad }) => isBad) ?? bug.shots[0])?.file ?? null,
    at: bug.at,
  });

  if (caught === null) return null;

  return {
    workspaceId,
    bugId: bug.id,
    severity: bug.severity,
    title: bug.title,
    body: bug.body,
    expected: bug.expected,
    got: bug.got,
    caseId: bug.caseId,
    caseTitle: bug.caseTitle,
    stepNumber: bug.stepNumber,
    target: sharedValueOf(bug.target),
    isIncidental: bug.isIncidental,
    isDismissed: bug.isDismissed,
    filed: bug.filed,
    repro: bug.repro.map(({ action, isBad }) => ({ action, isBad })),
    shots: bug.shots.map(({ file, isBad }) => ({ file, isBad })),
    caught,
    sightings: bug.sightings.flatMap((sighting) => {
      const seen = catchOf({
        runId: sighting.runId,
        caseId: sighting.caseId,
        stepNumber: sighting.stepNumber,
        shotFile: sighting.shot.file,
        at: sighting.at,
      });

      return seen === null ? [] : [seen];
    }),
    firstSeenAt: caught.runWhen,
  };
}
