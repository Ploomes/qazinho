import type { IInstallStep } from '@/main/classes/setup/SetupInstaller/types';
import type { InstallableId } from '@/shared/types';
import { join } from 'node:path';

const AGENTS: Record<Exclude<InstallableId, 'idb'>, string> = {
  'claude-code': '@anthropic-ai/claude-code',
  codex: '@openai/codex',
};

/** The commands that install a tool, in order. idb's client gets a Python of its own, so Homebrew's Pythons are never touched. */
export function recipeFor(props: { item: InstallableId; home: string }): IInstallStep[] {
  const { item, home } = props;

  if (item !== 'idb') return [{ command: 'npm', args: ['install', '-g', AGENTS[item]] }];

  const venv = join(home, '.local', 'share', 'qazinho', 'idb');
  const bin = join(home, '.local', 'bin');
  const companion = { command: 'brew', args: ['list', '--versions', 'idb-companion'] };

  return [
    { command: 'brew', args: ['tap', 'facebook/fb'], doneIf: companion },
    {
      command: 'brew',
      args: ['install', 'facebook/fb/idb-companion'],
      doneIf: companion,
    },
    {
      command: 'python3',
      args: ['-m', 'venv', venv],
      doneIf: { command: 'test', args: ['-x', join(venv, 'bin', 'python')] },
    },
    {
      command: join(venv, 'bin', 'pip'),
      args: ['install', '--upgrade', 'fb-idb'],
      doneIf: { command: 'test', args: ['-x', join(venv, 'bin', 'idb')] },
    },
    { command: 'mkdir', args: ['-p', bin] },
    { command: 'ln', args: ['-sf', join(venv, 'bin', 'idb'), join(bin, 'idb')] },
  ];
}
