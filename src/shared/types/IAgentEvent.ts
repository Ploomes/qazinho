import type { CodeStep } from './CodeStep';
import type { IAgentUsage } from './IAgentUsage';
import type { JiraStep } from './JiraStep';

/**
 * O que chega à página enquanto um turno roda: um comando, uma ferramenta, um celular
 * ou navegador aberto para olhar o app, e uma branch ou história lida para ele.
 */
export type IAgentEvent =
  | { kind: 'text'; workspaceId: string; text: string }
  | { kind: 'usage'; workspaceId: string; usage: IAgentUsage }
  | { kind: 'retry'; workspaceId: string; attempt: number; maxRetries: number }
  | { kind: 'code'; workspaceId: string; step: CodeStep; bytes: number }
  | { kind: 'jira'; workspaceId: string; step: JiraStep; bytes: number }
  | { kind: 'look'; workspaceId: string; device: 'android' | 'ios' }
  | { kind: 'action'; workspaceId: string; text: string }
  | { kind: 'tool'; workspaceId: string; tool: string; target: string }
  | {
      kind: 'device';
      workspaceId: string;
      streamUrl: string | null;
      address: string | null;
    };
