import type { AgentSignInFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const AGENT_SIGN_IN_FAILURES: Record<AgentSignInFailure, ParseKeys> = {
  unsupported: 'SETUP.LOGIN_FAIL_UNSUPPORTED',
  terminal: 'SETUP.LOGIN_FAIL_TERMINAL',
  timeout: 'SETUP.LOGIN_FAIL_TIMEOUT',
};
