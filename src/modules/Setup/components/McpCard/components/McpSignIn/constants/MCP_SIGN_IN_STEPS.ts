import type { McpSignInStep } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const MCP_SIGN_IN_STEPS: Record<McpSignInStep, ParseKeys> = {
  check: 'MCP.STEP_CHECK',
  add: 'MCP.STEP_ADD',
  open: 'MCP.STEP_OPEN',
  authorize: 'MCP.STEP_AUTHORIZE',
  browser: 'MCP.STEP_BROWSER',
  terminal: 'MCP.STEP_TERMINAL',
};
