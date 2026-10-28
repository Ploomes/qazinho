import type { McpServerState } from '@/shared/types';

/**
 * Uma linha de `claude mcp list`: o nome que o QA deu ao servidor, para onde ele aponta,
 * e a saúde dele.
 */
export interface IListedMcpServer {
  name: string;
  target: string;
  state: Exclude<McpServerState, 'no-agent' | 'missing'>;
}
