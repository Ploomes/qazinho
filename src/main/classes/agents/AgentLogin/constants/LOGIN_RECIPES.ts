import type { ILoginRecipe } from '@/main/classes/agents/AgentLogin/types';

export const LOGIN_RECIPES: Partial<Record<string, ILoginRecipe>> = {
  'claude-code': { args: ['auth', 'login', '--claudeai'], takesCode: true },
  codex: { args: ['login'], takesCode: false },
};
