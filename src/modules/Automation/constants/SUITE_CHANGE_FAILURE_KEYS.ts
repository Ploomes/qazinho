import type { SuiteChangeFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const SUITE_CHANGE_FAILURE_KEYS: Record<SuiteChangeFailure['reason'], ParseKeys> =
  {
    'no-suite': 'AUTOMATION.CHANGE_FAILED_NO_SUITE',
    'no-git': 'AUTOMATION.CHANGE_FAILED_NO_GIT',
    copy: 'AUTOMATION.CHANGE_FAILED_COPY',
    'no-runner': 'AUTOMATION.CHANGE_FAILED_NO_RUNNER',
    'agent-missing': 'AUTOMATION.CHANGE_FAILED_AGENT_MISSING',
    agent: 'AUTOMATION.CHANGE_FAILED_AGENT',
    'no-change': 'AUTOMATION.CHANGE_FAILED_NO_CHANGE',
    closed: 'AUTOMATION.CHANGE_FAILED_CLOSED',
    other: 'AUTOMATION.CHANGE_FAILED_OTHER',
  };
