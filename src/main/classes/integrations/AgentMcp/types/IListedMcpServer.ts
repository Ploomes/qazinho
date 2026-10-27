import type { McpServerState } from '@/shared/types';

/**
 * One line of `claude mcp list`: the name the QA gave the server, where it points, and
 * its health.
 */
export interface IListedMcpServer {
  name: string;
  target: string;
  state: Exclude<McpServerState, 'no-agent' | 'missing'>;
}
