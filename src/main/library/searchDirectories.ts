import { posix, win32 } from 'node:path';
import { mergePathSegments } from './mergePathSegments';

const POSIX_DIRS = [
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/snap/bin',
  '/home/linuxbrew/.linuxbrew/bin',
  '.local/bin',
  '.bun/bin',
  '.deno/bin',
  '.claude/local',
  '.npm-global/bin',
];

/**
 * Todo diretório em que um comando poderia estar: o PATH do app, o do shell, depois onde
 * as instalações caem nesta plataforma.
 */
export function searchDirectories(props: {
  appPath: string | undefined;
  shellPath: string | undefined;
  home: string;
  platform: NodeJS.Platform;
  env: Record<string, string | undefined>;
}): string[] {
  return mergePathSegments({
    platform: props.platform,
    segments: [
      props.appPath,
      props.shellPath,
      ...(props.platform === 'win32'
        ? windowsDirs(props)
        : POSIX_DIRS.map((directory) =>
            posix.isAbsolute(directory) ? directory : posix.join(props.home, directory),
          )),
    ],
  });
}

function windowsDirs(props: {
  home: string;
  env: Record<string, string | undefined>;
}): string[] {
  const appData = props.env.APPDATA ?? win32.join(props.home, 'AppData', 'Roaming');
  const localAppData =
    props.env.LOCALAPPDATA ?? win32.join(props.home, 'AppData', 'Local');
  const programFiles = props.env.ProgramFiles ?? 'C:\\Program Files';

  return [
    win32.join(appData, 'npm'),
    win32.join(props.home, '.local', 'bin'),
    win32.join(props.home, '.claude', 'local'),
    win32.join(props.home, '.bun', 'bin'),
    win32.join(localAppData, 'Microsoft', 'WinGet', 'Links'),
    win32.join(localAppData, 'Programs', 'nodejs'),
    win32.join(programFiles, 'nodejs'),
    win32.join(programFiles, 'Git', 'cmd'),
    win32.join(programFiles, 'GitHub CLI'),
    win32.join(props.env.SystemRoot ?? 'C:\\Windows', 'System32'),
  ];
}
