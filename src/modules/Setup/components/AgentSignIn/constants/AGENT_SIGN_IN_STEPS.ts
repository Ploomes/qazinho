import type { AgentSignInStep } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const AGENT_SIGN_IN_STEPS: Record<AgentSignInStep, ParseKeys> = {
  start: 'SETUP.LOGIN_STEP_START',
  browser: 'SETUP.LOGIN_STEP_BROWSER',
};
