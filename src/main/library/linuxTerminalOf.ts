import { findOnPath } from '@ploomes/qazinho-harness/engine';

const TERMINALS = [
  'x-terminal-emulator',
  'gnome-terminal',
  'konsole',
  'xfce4-terminal',
  'xterm',
];

/**
 * O primeiro terminal que este desktop Linux tem, e como fazê-lo rodar um script de shell
 * que o QA acompanha; null sem nenhum.
 */
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
