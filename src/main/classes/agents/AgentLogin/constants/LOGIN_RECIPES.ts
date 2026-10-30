import type { ILoginRecipe } from '@/main/classes/agents/AgentLogin/types';

export const LOGIN_RECIPES: Partial<Record<string, ILoginRecipe>> = {
  'claude-code': { args: ['auth', 'login', '--claudeai'] },
  codex: { args: ['login'] },
};
