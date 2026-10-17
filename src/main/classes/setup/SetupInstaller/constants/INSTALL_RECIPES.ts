import type { IInstallStep } from '@/main/classes/setup/SetupInstaller/types';
import type { InstallableId } from '@/types';

export const INSTALL_RECIPES: Record<InstallableId, IInstallStep[]> = {
  'claude-code': [
    { command: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'] },
  ],
  codex: [{ command: 'npm', args: ['install', '-g', '@openai/codex'] }],
  'gemini-cli': [{ command: 'npm', args: ['install', '-g', '@google/gemini-cli'] }],
  idb: [
    { command: 'brew', args: ['tap', 'facebook/fb'] },
    { command: 'brew', args: ['install', 'facebook/fb/idb-companion'] },
    { command: 'brew', args: ['install', 'pipx'] },
    { command: 'pipx', args: ['install', 'fb-idb'] },
  ],
};
