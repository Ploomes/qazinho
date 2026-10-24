import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { AppBridge } from '@/main/classes/assistant/AppBridge';
import type { Harness, McpHost } from '@salve-software/qazinho-harness';

/** What the assistant needs: the QA's agent, QAzinho's MCP host and harness, the bridge to the page, and a look at the disk. */
export interface IAssistantAgent {
  runner: Pick<AgentRunner, 'ask' | 'cancel'>;
  tools: Pick<McpHost, 'attachApp' | 'detachApp' | 'mcpConfigFor'>;
  harness: Pick<Harness, 'assistant'>;
  bridge: Pick<AppBridge, 'act' | 'dropAll'>;
  findCommand: (agentId: string) => Promise<string | null>;
  kindOf: (path: string) => Promise<'file' | 'directory' | null>;
  home: string;
}
