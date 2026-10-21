import type { CodeStep } from './CodeStep';
import type { IAgentUsage } from './IAgentUsage';

/** What reaches the page while a turn is still running. */
export type IAgentEvent =
  | { kind: 'text'; workspaceId: string; text: string }
  | { kind: 'usage'; workspaceId: string; usage: IAgentUsage }
  | { kind: 'retry'; workspaceId: string; attempt: number; maxRetries: number }
  | { kind: 'code'; workspaceId: string; step: CodeStep; bytes: number };
