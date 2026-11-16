import type { IReleaseNote } from '@/modules/Help/types';
import { compareVersions } from './compareVersions';

/** As versões que este app já traz, da mais nova à mais velha. */
export function shippedNotesOf(args: {
  notes: readonly IReleaseNote[];
  version: string;
}): IReleaseNote[] {
  return args.notes
    .filter((release) => compareVersions(release.version, args.version) <= 0)
    .sort((first, second) => compareVersions(second.version, first.version));
}
