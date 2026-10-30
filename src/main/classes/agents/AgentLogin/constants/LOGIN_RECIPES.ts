import type { ILoginRecipe } from '@/main/classes/agents/AgentLogin/types';

export const LOGIN_RECIPES: Partial<Record<string, ILoginRecipe>> = {
  'claude-code': {
    login: ['auth', 'login', '--claudeai'],
    status: { args: ['auth', 'status'], reads: 'claude' },
  },
  codex: {
    login: ['login'],
    status: { args: ['login', 'status'], reads: 'codex' },
  },
};
