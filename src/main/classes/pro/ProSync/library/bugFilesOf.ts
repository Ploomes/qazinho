import type { IProSyncBug } from '@/shared/types';

/** The screens a bug keeps in the archive: its own, then its first catch's and each sighting's. */
export function bugFilesOf(bug: IProSyncBug): string[] {
  const own = bug.shots.flatMap(({ file }) => (file === null ? [] : [file]));
  const seen = [...(bug.caught === null ? [] : [bug.caught]), ...bug.sightings].flatMap(
    ({ shotFile }) => (shotFile === null ? [] : [shotFile]),
  );

  return [...new Set([...own, ...seen])];
}
