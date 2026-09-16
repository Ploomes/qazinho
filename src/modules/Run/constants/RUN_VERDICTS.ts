import type { IRunCounts } from '@/modules/Run/types';

export const RUN_VERDICTS: (keyof IRunCounts)[] = [
  'passed',
  'failed',
  'blocked',
  'skipped',
];
