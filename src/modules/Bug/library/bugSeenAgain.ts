import type { IBug, IBugSighting } from '@/modules/Bug/types';
import { isSeenIn } from './isSeenIn';

/**
 * A bug caught again: the sighting joins it, a run that had not caught it before counts
 * once more, and it reads as just caught.
 */
export function bugSeenAgain(props: { bug: IBug; sighting: IBugSighting }): IBug {
  const { bug, sighting } = props;

  return {
    ...bug,
    sightings: [...bug.sightings, sighting],
    seenRuns: isSeenIn({ bug, runId: sighting.runId }) ? bug.seenRuns : bug.seenRuns + 1,
    isNew: true,
  };
}
