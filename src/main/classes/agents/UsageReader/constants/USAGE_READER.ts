import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

export const USAGE_READER = {
  agentId: 'claude-code',
  args: [
    '--print',
    '--output-format',
    'json',
    '--settings',
    AGENT_RUN.settings,
    '--tools',
    '',
    '--',
    '/usage',
  ],
  timeoutMs: 30_000,
} as const;
