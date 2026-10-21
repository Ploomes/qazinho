/** One call to the agent's CLI, with the harness around it: its system prompt, the tools it may use and the folders, and what its environment adds. */
export interface IRunAgent {
  workspaceId: string;
  agentId: string;
  command: string;
  model: string;
  sessionId: string | null;
  prompt: string;
  schema?: string;
  systemPrompt?: string;
  mcpConfig?: string;
  allowedTools?: string[];
  readDirs?: string[];
  tools?: string[];
  writeDir?: string;
  env?: Record<string, string>;
}
