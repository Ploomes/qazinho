import type { McpActionResult } from '@/shared/types';

export const NO_BRIDGE_MCP: McpActionResult = {
  ok: false,
  error: 'QAzinho is not talking to the machine. Restart the app.',
};
