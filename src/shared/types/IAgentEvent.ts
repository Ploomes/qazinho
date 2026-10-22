import type { CodeStep } from './CodeStep';
import type { IAgentUsage } from './IAgentUsage';
import type { JiraStep } from './JiraStep';

/** What reaches the page while a turn is still running, a command or a file it works on included, a phone opened to look at the app, and a branch or a Jira story read for it. */
export type IAgentEvent =
  | { kind: 'text'; workspaceId: string; text: string }
  | { kind: 'usage'; workspaceId: string; usage: IAgentUsage }
  | { kind: 'retry'; workspaceId: string; attempt: number; maxRetries: number }
  | { kind: 'code'; workspaceId: string; step: CodeStep; bytes: number }
  | { kind: 'jira'; workspaceId: string; step: JiraStep; bytes: number }
  | { kind: 'look'; workspaceId: string; device: 'android' | 'ios' }
  | { kind: 'action'; workspaceId: string; text: string };
