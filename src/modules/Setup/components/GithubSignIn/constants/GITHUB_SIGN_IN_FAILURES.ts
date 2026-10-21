import type { GithubSignInFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const GITHUB_SIGN_IN_FAILURES: Record<GithubSignInFailure, ParseKeys> = {
  missing: 'SETUP.GITHUB_FAIL_MISSING',
  refused: 'SETUP.GITHUB_FAIL_REFUSED',
  timeout: 'SETUP.GITHUB_FAIL_TIMEOUT',
  closed: 'SETUP.GITHUB_FAIL_CLOSED',
};
