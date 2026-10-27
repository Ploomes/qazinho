import type { IBug, IBugShot } from '@/modules/Bug/types';

/**
 * The screen a QA pastes into an issue by hand: the one the latest run caught, else the
 * one that broke, as long as it can still be read.
 */
export function pasteShotOf(bug: IBug): IBugShot | null {
  const shot =
    bug.sightings.at(-1)?.shot ??
    bug.shots.find(({ isBad }) => isBad) ??
    bug.shots.at(-1) ??
    null;

  return shot !== null && (shot.file !== null || shot.src !== null) ? shot : null;
}
