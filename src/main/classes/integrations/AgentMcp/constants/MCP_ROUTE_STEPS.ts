import type { McpSignInRoute } from '@/main/classes/integrations/AgentMcp/types';
import type { McpSignInStep } from '@/shared/types';

export const MCP_ROUTE_STEPS: Record<McpSignInRoute, McpSignInStep[]> = {
  hidden: ['open', 'authorize', 'browser'],
  browser: ['browser'],
  terminal: ['terminal'],
};
