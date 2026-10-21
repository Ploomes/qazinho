import type { VariableFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const VARIABLE_FAILURE_KEYS: Record<VariableFailure['reason'], ParseKeys> = {
  'no-keychain': 'VARIABLES.FAILED_NO_KEYCHAIN',
  'no-bridge': 'COMMON.NO_BRIDGE',
  'bad-name': 'VARIABLES.BAD_NAME',
  taken: 'VARIABLES.FAILED_TAKEN',
  'no-value': 'VARIABLES.NEEDS_VALUE',
  missing: 'VARIABLES.FAILED_MISSING',
};
