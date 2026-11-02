import type { McpServerId } from '@/shared/types';
import type { ParseKeys } from 'i18next';

/**
 * Um servidor MCP que o QAzinho pode configurar no agente do QA, e o que ele dá ao
 * agente.
 */
export interface IMcpServer {
  id: McpServerId;
  name: string;
  logo: string;
  textKey: ParseKeys;
}
