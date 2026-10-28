import type { IProSyncBug } from '@/shared/types';

/**
 * As telas que um bug guarda no arquivo: a dele, depois a da primeira vez em que foi pego
 * e a de cada vista.
 */
export function bugFilesOf(bug: IProSyncBug): string[] {
  const own = bug.shots.flatMap(({ file }) => (file === null ? [] : [file]));
  const seen = [...(bug.caught === null ? [] : [bug.caught]), ...bug.sightings].flatMap(
    ({ shotFile }) => (shotFile === null ? [] : [shotFile]),
  );

  return [...new Set([...own, ...seen])];
}
