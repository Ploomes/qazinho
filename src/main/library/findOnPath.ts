import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

/** Looks for the binary itself. Spawning `which` would cost a process per agent, per check. */
export function findOnPath(props: {
  command: string;
  directories: string[];
}): string | null {
  const { command, directories } = props;

  for (const directory of directories) {
    const candidate = join(directory, command);

    try {
      accessSync(candidate, constants.X_OK);

      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}
