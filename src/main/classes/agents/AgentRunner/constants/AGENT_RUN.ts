export const AGENT_RUN = {
  timeoutMs: 30 * 60 * 1000,
  interruptGraceMs: 2_000,
  structuredTool: 'StructuredOutput',
  replyField: 'reply',
  figmaServer: 'figma',
  readTools: 'Read,Grep,Glob',
  settings: '{"disableAllHooks":true}',
  orgServer: 'qazinho-org',
} as const;
