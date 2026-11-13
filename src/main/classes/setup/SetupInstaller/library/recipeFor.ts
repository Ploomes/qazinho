import type { IInstallStep } from '@/main/classes/setup/SetupInstaller/types';
import type { InstallableId } from '@/shared/types';
import { join } from 'node:path';
import { INSTALL } from '@/main/classes/setup/SetupInstaller/constants';

const AGENTS: Record<Exclude<InstallableId, 'axe' | 'gh'>, string> = {
  'claude-code': '@anthropic-ai/claude-code',
  codex: '@openai/codex',
};

/**
 * Os comandos que instalam uma ferramenta, em ordem; o AXe vem do tarball universal
 * pré-compilado do release, extraído com os frameworks dele e ligado no PATH do QA.
 */
export function recipeFor(props: {
  item: InstallableId;
  home: string;
  platform: NodeJS.Platform;
}): IInstallStep[] {
  const { item, home } = props;

  if (item === 'gh' && props.platform === 'win32')
    return [
      {
        command: 'winget',
        args: [
          'install',
          '--id',
          'GitHub.cli',
          '--exact',
          '--silent',
          '--accept-package-agreements',
          '--accept-source-agreements',
        ],
        doneIf: { command: 'winget', args: ['list', '--id', 'GitHub.cli', '--exact'] },
      },
    ];

  if (item === 'gh')
    return [
      {
        command: 'brew',
        args: ['install', 'gh'],
        doneIf: { command: 'brew', args: ['list', '--versions', 'gh'] },
      },
    ];

  if (item !== 'axe') return [{ command: 'npm', args: ['install', '-g', AGENTS[item]] }];

  const dir = join(home, '.local', 'share', 'qazinho', 'axe');
  const bin = join(home, '.local', 'bin');
  const tarball = join(dir, 'axe.tar.gz');
  const axe = join(dir, 'axe');

  return [
    { command: 'mkdir', args: ['-p', dir] },
    { command: 'curl', args: ['-fsSL', '-o', tarball, INSTALL.axeUrl] },
    { command: 'tar', args: ['xzf', tarball, '-C', dir] },
    { command: 'mkdir', args: ['-p', bin] },
    { command: 'ln', args: ['-sf', axe, join(bin, 'axe')] },
  ];
}
