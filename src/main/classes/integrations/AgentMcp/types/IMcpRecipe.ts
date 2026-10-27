import type { McpSignInRoute } from './McpSignInRoute';

/**
 * How one agent CLI keeps MCP servers: the commands to list, add, sign in and remove, how
 * its list reads, and its sign-in route.
 */
export interface IMcpRecipe {
  list: string[];
  reads: 'claude' | 'codex';
  add: (server: { name: string; url: string }) => string[];
  login: (name: string) => string[];
  remove: (name: string) => string[];
  signIn: Exclude<McpSignInRoute, 'terminal'>;
}
