import type { McpServerId } from '@/shared/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';
import { PRO_API } from '@/main/constants/PRO_API';
import { FIGMA_MCP } from '@salve-software/qazinho-harness';

export const MCP_CATALOG: Record<McpServerId, { name: string; url: string }> = {
  figma: FIGMA_MCP,
  org: { name: AGENT_RUN.orgServer, url: `${PRO_API.url}/api/mcp` },
};
