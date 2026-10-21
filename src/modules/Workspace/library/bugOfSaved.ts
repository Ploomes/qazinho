import type { IBug } from '@/modules/Bug';
import type { SavedBug } from '@/modules/Workspace/types';

function numberIn(text: string | undefined): number | null {
  const found = /\d+/.exec(text ?? '');

  return found === null ? null : Number(found[0]);
}

/** A saved bug read back, an older one included: "step 2" becomes 2, "once" becomes one run, and none was seen again. */
export function bugOfSaved(saved: SavedBug): IBug {
  const { step, seen, ...bug } = saved;

  return {
    ...bug,
    stepNumber: bug.stepNumber ?? numberIn(step) ?? 1,
    seenRuns: bug.seenRuns ?? numberIn(seen) ?? 1,
    agent: bug.agent ?? '',
    modelName: bug.modelName ?? null,
    isIncidental: bug.isIncidental ?? false,
    at: bug.at ?? null,
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
