import type { IBug } from '@/modules/Bug';
import type { SavedBug } from '@/modules/Workspace/types';

/** A saved bug read back, an older one included, in today's shape. */
export function bugOfSaved(saved: SavedBug): IBug {
  const { step, seen, ...bug } = saved;

  return {
    ...bug,
    stepNumber: bug.stepNumber ?? numberIn(step) ?? 1,
    seenRuns: bug.seenRuns ?? numberIn(seen) ?? 1,
    agent: bug.agent ?? '',
    modelName: bug.modelName ?? null,
    isIncidental: bug.isIncidental ?? false,
    isDismissed: bug.isDismissed ?? false,
    at: bug.at ?? null,
    filed: bug.filed ?? null,
    frame: bug.frame ?? null,
    reviewedRuns:
      bug.reviewedRuns ??
      (bug.filed === undefined || bug.filed === null
        ? []
        : [...new Set([bug.runId, ...(bug.sightings ?? []).map(({ runId }) => runId)])]),
    review:
      bug.review === undefined || bug.review === null || bug.review.state === 'reviewing'
        ? null
        : bug.review.state === 'posting'
          ? { ...bug.review, state: 'suggested' }
          : bug.review,
    shots: bug.shots.map(({ isBad, src, file }) => ({ isBad, src, file })),
    sightings: (bug.sightings ?? []).map((sighting) => ({
      ...sighting,
      shot: {
        isBad: sighting.shot.isBad,
        src: sighting.shot.src,
        file: sighting.shot.file,
      },
    })),
  };
}

function numberIn(text: string | undefined): number | null {
  const found = /\d+/.exec(text ?? '');

  return found === null ? null : Number(found[0]);
}
