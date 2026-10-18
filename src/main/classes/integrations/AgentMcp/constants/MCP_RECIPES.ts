import type { IMcpRecipe } from '@/main/classes/integrations/AgentMcp/types';

export const MCP_RECIPES: Partial<Record<string, IMcpRecipe>> = {
  'claude-code': {
    list: ['mcp', 'list'],
    reads: 'claude',
    add: ({ name, url }) => [
      'mcp',
      'add',
      '--transport',
      'http',
      '--scope',
      'user',
      name,
      url,
    ],
    login: () => ['/mcp'],
    remove: (name) => ['mcp', 'remove', '--scope', 'user', name],
    signIn: 'hidden',
  },
  codex: {
    list: ['mcp', 'list', '--json'],
    reads: 'codex',
    add: ({ name, url }) => ['mcp', 'add', name, '--url', url],
    login: (name) => ['mcp', 'login', name],
    remove: (name) => ['mcp', 'remove', name],
    signIn: 'browser',
  },
};
