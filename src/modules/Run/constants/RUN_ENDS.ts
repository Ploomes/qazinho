import type { RunEnd } from '@/modules/Run/types';

export const RUN_ENDS = {
  finished: null,
  stopped: { glyph: '■', labelKey: 'RUN.ENDED_STOPPED' },
  broke: { glyph: '!', labelKey: 'RUN.ENDED_BROKE' },
  interrupted: { glyph: '◐', labelKey: 'RUN.ENDED_INTERRUPTED' },
} as const satisfies Record<RunEnd, { glyph: string; labelKey: string } | null>;
