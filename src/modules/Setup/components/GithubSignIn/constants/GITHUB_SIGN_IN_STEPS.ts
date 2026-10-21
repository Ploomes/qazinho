import type { GithubSignInStep } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const GITHUB_SIGN_IN_STEPS: Record<GithubSignInStep, ParseKeys> = {
  code: 'SETUP.GITHUB_STEP_CODE',
  browser: 'SETUP.GITHUB_STEP_BROWSER',
  account: 'SETUP.GITHUB_STEP_ACCOUNT',
};
