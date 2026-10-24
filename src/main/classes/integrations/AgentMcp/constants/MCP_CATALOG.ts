import type { McpServerId } from '@/shared/types';
import { FIGMA_MCP } from '@salve-software/qazinho-harness';

export const MCP_CATALOG: Record<McpServerId, { name: string; url: string }> = {
  figma: FIGMA_MCP,
};
