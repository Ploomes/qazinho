import type { IBug, IBugShot } from '@/modules/Bug/types';

/**
 * A tela que um QA cola numa issue à mão: a que a última run pegou, senão a que quebrou,
 * contanto que ainda possa ser lida.
 */
export function pasteShotOf(bug: IBug): IBugShot | null {
  const shot =
    bug.sightings.at(-1)?.shot ??
    bug.shots.find(({ isBad }) => isBad) ??
    bug.shots.at(-1) ??
    null;

  return shot !== null && (shot.file !== null || shot.src !== null) ? shot : null;
}
