import type { McpServerId } from './McpServerId';
import type { McpServerState } from './McpServerState';

/** One MCP server QAzinho knows, as the QA's agent reports it now. */
export interface IMcpServerStatus {
  id: McpServerId;
  state: McpServerState;
}
