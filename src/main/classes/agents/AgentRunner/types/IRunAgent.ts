import type { IAskAgent } from '@/types';

/** One call to the agent's CLI, with the harness around it: its system prompt and the tools it may use. */
export interface IRunAgent extends IAskAgent {
  command: string;
  systemPrompt?: string;
  mcpConfig?: string;
}
