import type { ProSignInStep } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const PRO_SIGN_IN_STEPS: Record<ProSignInStep, ParseKeys> = {
  code: 'PRO.STEP_CODE',
  browser: 'PRO.STEP_BROWSER',
  account: 'PRO.STEP_ACCOUNT',
};
