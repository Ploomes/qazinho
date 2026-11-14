import type { RunHow } from '@/shared/types';

export const RUN_HOW_KEYS = {
  develop: 'RUN.HOW_DEVELOP',
  replay: 'RUN.HOW_REPLAY',
  adjust: 'RUN.HOW_ADJUST',
  prepare: 'RUN.HOW_PREPARE',
  manual: 'RUN.HOW_MANUAL',
  check: 'RUN.HOW_CHECK',
} as const satisfies Record<RunHow | 'check', string>;
