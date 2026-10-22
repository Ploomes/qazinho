import type { SuiteFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const SUITE_FAILURE_KEYS: Record<SuiteFailure, ParseKeys> = {
  'no-suite': 'AUTOMATION.FAILURE_NO_SUITE',
  'no-runner': 'AUTOMATION.FAILURE_NO_RUNNER',
  'no-node': 'AUTOMATION.FAILURE_NO_NODE',
  unreadable: 'AUTOMATION.FAILURE_UNREADABLE',
};
