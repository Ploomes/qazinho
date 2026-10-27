/**
 * Where an MCP server stands in the QA's agent: no agent, an agent QAzinho cannot set up
 * yet, not added, signed out, working, or broken.
 */
export type McpServerState =
  'no-agent' | 'unsupported' | 'missing' | 'needs-auth' | 'connected' | 'failed';
