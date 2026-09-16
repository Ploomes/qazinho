/** What the page asks of an agent: a prompt, on a model, continuing a session or starting one. */
export interface IAskAgent {
  workspaceId: string;
  agentId: string;
  prompt: string;
  model: string;
  sessionId: string | null;
  schema?: string;
}
