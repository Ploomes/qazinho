import type { BugFilter } from '@/modules/Bug/types';

export const BUG_FILTER_KEYS = {
  all: 'BUG.FILTER_ALL',
  high: 'BUG.SEVERITY_HIGH',
  medium: 'BUG.SEVERITY_MEDIUM',
  low: 'BUG.SEVERITY_LOW',
} as const satisfies Record<BugFilter, string>;
