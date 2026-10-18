import type { McpSignInFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const MCP_SIGN_IN_FAILURES: Record<McpSignInFailure, ParseKeys> = {
  unsupported: 'MCP.FAIL_UNSUPPORTED',
  add: 'MCP.FAIL_ADD',
  screen: 'MCP.FAIL_SCREEN',
  refused: 'MCP.FAIL_REFUSED',
  timeout: 'MCP.FAIL_TIMEOUT',
  closed: 'MCP.FAIL_CLOSED',
  manual: 'MCP.FAIL_MANUAL',
};
