/** Where an MCP server stands in the QA's agent: no agent to hold it, not added, added but signed out, working, or broken. */
export type McpServerState =
  'no-agent' | 'missing' | 'needs-auth' | 'connected' | 'failed';
