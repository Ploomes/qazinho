import type { McpServerId } from './McpServerId';

/** Which server, in which of the QA's agents. */
export interface IMcpServerTarget {
  id: McpServerId;
  agentId: string;
}
