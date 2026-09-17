import { isAbsolute, join } from 'node:path';
import { mergePathSegments } from './mergePathSegments';

// Where agents, Homebrew and pipx land when the PATH the app inherited does not mention them.
const INSTALL_DIRS = [
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '.local/bin',
  '.bun/bin',
  '.deno/bin',
  '.claude/local',
  '.npm-global/bin',
];

/** Every directory a command could be in: the app's PATH, the shell's, then the usual install places. */
export function searchDirectories(props: {
  appPath: string | undefined;
  shellPath: string | undefined;
  home: string;
}): string[] {
  return mergePathSegments([
    props.appPath,
    props.shellPath,
    ...INSTALL_DIRS.map((directory) =>
      isAbsolute(directory) ? directory : join(props.home, directory),
    ),
  ]);
}
