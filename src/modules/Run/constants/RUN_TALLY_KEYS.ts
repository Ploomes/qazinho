import type { IRunCounts } from '@/modules/Run/types';

export const RUN_TALLY_KEYS = {
  passed: { one: 'RUN.TALLY_PASSED_ONE', other: 'RUN.TALLY_PASSED_OTHER' },
  failed: { one: 'RUN.TALLY_FAILED_ONE', other: 'RUN.TALLY_FAILED_OTHER' },
  blocked: { one: 'RUN.TALLY_BLOCKED_ONE', other: 'RUN.TALLY_BLOCKED_OTHER' },
  skipped: { one: 'RUN.TALLY_SKIPPED_ONE', other: 'RUN.TALLY_SKIPPED_OTHER' },
} as const satisfies Record<keyof IRunCounts, { one: string; other: string }>;
