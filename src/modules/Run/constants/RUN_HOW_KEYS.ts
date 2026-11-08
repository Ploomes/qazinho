import type { RunHow } from '@/shared/types';

export const RUN_HOW_KEYS = {
  develop: 'RUN.HOW_DEVELOP',
  replay: 'RUN.HOW_REPLAY',
  adjust: 'RUN.HOW_ADJUST',
} as const satisfies Record<RunHow, string>;
