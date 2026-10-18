import type { IAgentOption } from '@/modules/Settings/types';

export const AGENTS: IAgentOption[] = [
  {
    name: 'Claude Code',
    isFound: true,
    note: 'default',
    path: '/opt/homebrew/bin/claude',
  },
  { name: 'Codex', isFound: true, note: 'found', path: '/usr/local/bin/codex' },
];
