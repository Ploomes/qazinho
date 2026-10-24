import type { IProSyncBug } from '@/shared/types';

/** The screens a bug keeps in the archive: its own, then each sighting's. */
export function bugFilesOf(bug: IProSyncBug): string[] {
  const own = bug.shots.flatMap(({ file }) => (file === null ? [] : [file]));
  const seen = bug.sightings.flatMap(({ shotFile }) =>
    shotFile === null ? [] : [shotFile],
  );

  return [...new Set([...own, ...seen])];
}
