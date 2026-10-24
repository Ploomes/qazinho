import type { IBug } from '@/modules/Bug/types';
import type { IRun } from '@/modules/Run/types';
import type { IProSyncBug } from '@/shared/types';
import { sharedValueOf } from './sharedValueOf';
import { startedIsoOf } from './startedIsoOf';

/** A bug as QAzinho Pro takes it, first seen when the run that caught it started; null when that run does not know when it started. */
export function syncedBugOf(props: {
  workspaceId: string;
  bug: IBug;
  runs: IRun[];
}): IProSyncBug | null {
  const { workspaceId, bug, runs } = props;
  const startOf = (runId: string) => {
    const run = runs.find(({ id }) => id === runId);

    return run === undefined ? null : startedIsoOf(run);
  };
  const firstSeenAt = startOf(bug.runId);

  if (firstSeenAt === null) return null;

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
    sightings: bug.sightings.map((sighting) => ({
      runId: sighting.runId,
      runWhen: startOf(sighting.runId),
      caseId: sighting.caseId,
      stepNumber: sighting.stepNumber,
      shotFile: sighting.shot.file,
      at: sighting.at,
    })),
    firstSeenAt,
  };
}
