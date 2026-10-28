import type { IBug, IBugSighting } from '@/modules/Bug/types';
import { SIGHTINGS_KEPT } from '@/modules/Bug/constants';
import { isSeenIn } from './isSeenIn';

/**
 * Um bug pego de novo: a vista entra nas últimas dele, uma run que não o tinha pego conta
 * mais uma vez, e ele aparece como recém-pego.
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
