/** A plan can take a while to draft; nothing the QA asked for should hang forever either. */
export const AGENT_RUN = {
  timeoutMs: 30 * 60 * 1000,
  structuredTool: 'StructuredOutput',
} as const;
