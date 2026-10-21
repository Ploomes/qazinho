import type { IBug, IBugAppearance } from '@/modules/Bug/types';

/** Every time a bug was caught, the first time and each one after, in the order they came. */
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
