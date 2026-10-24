import type { ProSignInFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const PRO_SIGN_IN_FAILURES: Record<ProSignInFailure, ParseKeys> = {
  unreachable: 'PRO.FAIL_UNREACHABLE',
  denied: 'PRO.FAIL_DENIED',
  expired: 'PRO.FAIL_EXPIRED',
  'no-keychain': 'PRO.FAIL_NO_KEYCHAIN',
  unexpected: 'PRO.FAIL_UNEXPECTED',
};
