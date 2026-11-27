import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { AppBridge } from '@/main/classes/assistant/AppBridge';
import type { Harness, McpHost } from '@ploomes/qazinho-harness';

/**
 * O que o assistente precisa: o agente do QA, o host MCP e o harness do QAzinho, a bridge
 * até a página, e um olhar para o disco.
 */
export interface IAssistantAgent {
  runner: Pick<AgentRunner, 'ask' | 'cancel'>;
  tools: Pick<McpHost, 'attachApp' | 'detachApp' | 'mcpConfigFor'>;
  harness: Pick<Harness, 'assistant'>;
  bridge: Pick<AppBridge, 'act' | 'dropAll'>;
  findCommand: (agentId: string) => Promise<string | null>;
  kindOf: (path: string) => Promise<'file' | 'directory' | null>;
  home: string;
}
