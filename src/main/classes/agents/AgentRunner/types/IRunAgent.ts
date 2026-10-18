/** One call to the agent's CLI, with the harness around it: its system prompt and the tools it may use. */
export interface IRunAgent {
  workspaceId: string;
  command: string;
  model: string;
  sessionId: string | null;
  prompt: string;
  schema?: string;
  systemPrompt?: string;
  mcpConfig?: string;
  allowedTools?: string[];
}
