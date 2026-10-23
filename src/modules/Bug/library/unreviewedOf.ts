import type { IBug, IBugSighting } from '@/modules/Bug/types';

/** The times a filed bug came back that nobody weighed against its issue yet, one per run; none while a look is under way, for a bug never filed, or one the QA said is no bug. */
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
