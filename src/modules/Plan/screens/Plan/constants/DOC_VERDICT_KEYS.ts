import type { StepVerdict } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const DOC_VERDICT_KEYS: Record<StepVerdict, ParseKeys> = {
  pending: 'STATUS.NOT_RUN',
  running: 'STATUS.RUNNING',
  passed: 'STATUS.PASSED',
  failed: 'STATUS.FAILED',
  blocked: 'STATUS.BLOCKED',
  skipped: 'STATUS.SKIPPED',
};
