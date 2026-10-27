import type { IBug, IBugSighting } from '@/modules/Bug/types';
import { SIGHTINGS_KEPT } from '@/modules/Bug/constants';
import { isSeenIn } from './isSeenIn';

/**
 * A bug caught again: the sighting joins its latest, a run that had not caught it counts
 * once more, and it reads as just caught.
 */
export function bugSeenAgain(props: { bug: IBug; sighting: IBugSighting }): IBug {
  const { bug, sighting } = props;

  return {
    ...bug,
    sightings: [...bug.sightings, sighting].slice(-SIGHTINGS_KEPT),
    seenRuns: isSeenIn({ bug, runId: sighting.runId }) ? bug.seenRuns : bug.seenRuns + 1,
    isNew: true,
  };
}
