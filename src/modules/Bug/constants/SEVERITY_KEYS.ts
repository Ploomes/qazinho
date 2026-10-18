import type { Severity } from '@/shared/types';

export const SEVERITY_KEYS = {
  high: 'BUG.SEVERITY_HIGH',
  medium: 'BUG.SEVERITY_MEDIUM',
  low: 'BUG.SEVERITY_LOW',
} as const satisfies Record<Severity, string>;
