import type { IBug, IBugAppearance } from '@/modules/Bug/types';

/** Toda vez que um bug foi pego, a primeira e cada uma depois, na ordem em que vieram. */
export function appearancesOf(bug: IBug): IBugAppearance[] {
  return [
    {
      runId: bug.runId,
      runWhen: bug.runWhen,
      caseId: bug.caseId,
      stepNumber: bug.stepNumber,
      at: bug.at,
    },
    ...bug.sightings.map(({ runId, runWhen, caseId, stepNumber, at }) => ({
      runId,
      runWhen,
      caseId,
      stepNumber,
      at,
    })),
  ];
}
