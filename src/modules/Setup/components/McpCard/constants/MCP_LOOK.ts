import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';
import type { McpServerState } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const MCP_LOOK: Record<
  McpServerState | 'checking',
  { pill: PillStatus; labelKey: ParseKeys }
> = {
  checking: { pill: 'running', labelKey: 'MCP.CHECKING' },
  connected: { pill: 'passed', labelKey: 'MCP.CONNECTED' },
  'needs-auth': { pill: 'attention', labelKey: 'MCP.NEEDS_SIGN_IN' },
  failed: { pill: 'failed', labelKey: 'MCP.FAILED' },
  missing: { pill: 'idle', labelKey: 'MCP.NOT_ADDED' },
  'no-agent': { pill: 'idle', labelKey: 'MCP.NO_AGENT' },
  unsupported: { pill: 'idle', labelKey: 'MCP.UNSUPPORTED' },
};
