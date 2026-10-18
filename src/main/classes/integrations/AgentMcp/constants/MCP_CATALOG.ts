import type { McpServerId } from '@/shared/types';

export const MCP_CATALOG: Record<McpServerId, { name: string; url: string }> = {
  figma: { name: 'figma', url: 'https://mcp.figma.com/mcp' },
};
