import type { PillStatus } from '@/components/atoms/StatusPill/types';
import type { ParseKeys } from 'i18next';

/** Every status carries a glyph and a word, so colour is never the only clue. */
export const STATUS: Record<
  PillStatus,
  { glyph: string; labelKey: ParseKeys; tone: string }
> = {
  running: { glyph: '▸', labelKey: 'STATUS.RUNNING', tone: 'amber' },
  attention: { glyph: '!', labelKey: 'STATUS.NEEDS_YOU', tone: 'attn' },
  failed: { glyph: '✕', labelKey: 'STATUS.FAILED', tone: 'fail' },
  passed: { glyph: '✓', labelKey: 'STATUS.PASSED', tone: 'pass' },
  blocked: { glyph: '⊘', labelKey: 'STATUS.BLOCKED', tone: 'block' },
  skipped: { glyph: '–', labelKey: 'STATUS.SKIPPED', tone: 'skip' },
  stopped: { glyph: '■', labelKey: 'STATUS.STOPPED', tone: 'quiet' },
  idle: { glyph: '○', labelKey: 'STATUS.IDLE', tone: 'quiet' },
  pending: { glyph: '○', labelKey: 'STATUS.NOT_RUN', tone: 'quiet' },
};
