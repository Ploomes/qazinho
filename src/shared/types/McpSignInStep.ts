/**
 * One thing QAzinho does to connect an MCP server to the QA's agent, in the order the
 * sign-in popup lists them.
 */
export type McpSignInStep =
  'check' | 'add' | 'open' | 'authorize' | 'browser' | 'terminal';
