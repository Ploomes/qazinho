import type { McpServerId } from './McpServerId';
import type { McpServerState } from './McpServerState';

/** Um servidor MCP que o QAzinho conhece, como o agente do QA o relata agora. */
export interface IMcpServerStatus {
  id: McpServerId;
  state: McpServerState;
}
