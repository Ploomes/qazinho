import type { BugFilter } from '@/modules/Bug/types';

export const BUG_FILTER_KEYS = {
  open: 'BUG.TAB_OPEN',
  filed: 'BUG.TAB_FILED',
  dismissed: 'BUG.TAB_DISMISSED',
} as const satisfies Record<BugFilter, string>;
