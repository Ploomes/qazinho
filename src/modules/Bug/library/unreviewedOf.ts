import type { IBug, IBugSighting } from '@/modules/Bug/types';

/**
 * As vezes em que um bug registrado voltou e ninguém pesou contra a issue, uma por run;
 * nenhuma durante uma olhada, num bug não registrado, ou num que não é bug.
 */
export function unreviewedOf(bug: IBug): IBugSighting[] {
  if (bug.filed === null || bug.isDismissed || bug.review?.state === 'reviewing')
    return [];

  const seen = new Set(bug.reviewedRuns);

  return bug.sightings.filter(({ runId }) => {
    if (seen.has(runId)) return false;

    seen.add(runId);

    return true;
  });
}
