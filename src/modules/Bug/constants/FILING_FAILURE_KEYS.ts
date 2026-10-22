import type { FilingFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const FILING_FAILURE_KEYS: Record<FilingFailure, ParseKeys> = {
  'not-connected': 'FILING.FAILURE_NOT_CONNECTED',
  unauthorized: 'FILING.FAILURE_UNAUTHORIZED',
  'not-found': 'FILING.FAILURE_NOT_FOUND',
  unreachable: 'FILING.FAILURE_UNREACHABLE',
  rejected: 'FILING.FAILURE_REJECTED',
  unexpected: 'FILING.FAILURE_UNEXPECTED',
};
