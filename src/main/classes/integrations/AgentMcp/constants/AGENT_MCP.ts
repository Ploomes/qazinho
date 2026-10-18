export const AGENT_MCP = {
  timeoutMs: 45_000,
  maxBufferBytes: 1024 * 1024,
  signInFile: 'qazinho-mcp-sign-in.command',
  urlWaitMs: 30_000,
  browserSignInMs: 5 * 60_000,
} as const;
