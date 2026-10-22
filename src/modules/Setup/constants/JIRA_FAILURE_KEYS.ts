import type { JiraFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const JIRA_FAILURE_KEYS: Record<JiraFailure, ParseKeys> = {
  'not-connected': 'JIRA.FAILURE_NOT_CONNECTED',
  unauthorized: 'JIRA.FAILURE_UNAUTHORIZED',
  'not-found': 'JIRA.FAILURE_NOT_FOUND',
  unreachable: 'JIRA.FAILURE_UNREACHABLE',
  rejected: 'JIRA.FAILURE_REJECTED',
  unexpected: 'JIRA.FAILURE_UNEXPECTED',
};
