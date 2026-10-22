import type { SuiteChangeStep } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const SUITE_CHANGE_CARD = {
  internSize: 44,
  lines: 4,
  stepKeys: {
    copy: 'AUTOMATION.CHANGE_STEP_COPY',
    agent: 'AUTOMATION.CHANGE_STEP_AGENT',
    check: 'AUTOMATION.CHANGE_STEP_CHECK',
  } satisfies Record<SuiteChangeStep, ParseKeys>,
  writeStepKey: 'AUTOMATION.CHANGE_STEP_WRITE' satisfies ParseKeys,
} as const;
