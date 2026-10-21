export const AGENT_RUN = {
  timeoutMs: 30 * 60 * 1000,
  interruptGraceMs: 2_000,
  structuredTool: 'StructuredOutput',
  readTools: 'Read,Grep,Glob',
} as const;
