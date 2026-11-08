/**
 * Uma chamada à CLI do agente com o harness em volta: o prompt, as ferramentas, as
 * pastas, o ambiente e se o texto chega em pedaços.
 */
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
  permissionTool?: string;
  isStreamed?: boolean;
}
