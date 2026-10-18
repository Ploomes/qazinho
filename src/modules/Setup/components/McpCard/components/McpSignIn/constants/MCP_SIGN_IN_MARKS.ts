import type { McpSignInRowState } from '@/modules/Setup/components/McpCard/components/McpSignIn/types';

export const MCP_SIGN_IN_MARKS: Record<McpSignInRowState, string> = {
  done: '✓',
  failed: '✕',
  active: '',
  pending: '',
};
