import type { McpServerId } from './McpServerId';

/** Qual servidor, em qual dos agentes do QA. */
export interface IMcpServerTarget {
  id: McpServerId;
  agentId: string;
}
