import type { JiraFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const CONFLUENCE_FAILURE_KEYS: Record<JiraFailure, ParseKeys> = {
  'not-connected': 'CONFLUENCE.FAILURE_NOT_CONNECTED',
  unauthorized: 'CONFLUENCE.FAILURE_UNAUTHORIZED',
  'not-found': 'CONFLUENCE.FAILURE_NOT_FOUND',
  unreachable: 'CONFLUENCE.FAILURE_UNREACHABLE',
  rejected: 'CONFLUENCE.FAILURE_REJECTED',
  unexpected: 'CONFLUENCE.FAILURE_UNEXPECTED',
};
