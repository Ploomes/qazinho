import type { UnwalkedReason } from '@/shared/types';

export const UNWALKED_KEYS = {
  skipped: 'RUN.UNWALKED_SKIPPED',
  unreported: 'RUN.UNWALKED_UNREPORTED',
  noAgent: 'RUN.UNWALKED_NO_AGENT',
  capped: 'RUN.UNWALKED_CAPPED',
  asked: 'RUN.UNWALKED_ASKED',
  noValue: 'RUN.UNWALKED_NO_VALUE',
} as const satisfies Record<UnwalkedReason, string>;
