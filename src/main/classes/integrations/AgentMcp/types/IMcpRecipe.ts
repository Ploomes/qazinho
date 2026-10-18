/** How one agent CLI keeps MCP servers: the commands to list, add, sign in and remove, and how its list reads. */
export interface IMcpRecipe {
  list: string[];
  reads: 'claude' | 'codex';
  add: (server: { name: string; url: string }) => string[];
  login: (name: string) => string[];
  remove: (name: string) => string[];
  signIn: 'terminal' | 'browser';
}
