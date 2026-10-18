import type { McpServerId } from '@/shared/types';
import type { ParseKeys } from 'i18next';

/** An MCP server QAzinho can set up in the QA's agent, and what it gives the agent. */
export interface IMcpServer {
  id: McpServerId;
  name: string;
  logo: string;
  textKey: ParseKeys;
  needsKey: ParseKeys;
}
