import { findOnPath } from './findOnPath';

const TERMINALS = [
  'x-terminal-emulator',
  'gnome-terminal',
  'konsole',
  'xfce4-terminal',
  'xterm',
];

/** The first terminal this Linux desktop has, and how to make it run a shell script the QA watches; null with none. */
export function linuxTerminalOf(props: {
  directories: string[];
  file: string;
}): { command: string; args: string[] } | null {
  for (const name of TERMINALS) {
    const command = findOnPath({
      command: name,
      directories: props.directories,
      platform: 'linux',
    });

    if (command !== null)
      return {
        command,
        args:
          name === 'gnome-terminal'
            ? ['--', '/bin/sh', props.file]
            : name === 'xfce4-terminal'
              ? ['-x', '/bin/sh', props.file]
              : ['-e', '/bin/sh', props.file],
      };
  }

  return null;
}
