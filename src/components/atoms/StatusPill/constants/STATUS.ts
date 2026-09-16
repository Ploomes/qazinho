import type { PillStatus } from '@/components/atoms/StatusPill/types';

/** Every status carries a glyph and a word, so colour is never the only clue. */
export const STATUS: Record<PillStatus, { glyph: string; label: string; tone: string }> =
  {
    running: { glyph: '▸', label: 'running', tone: 'amber' },
    attention: { glyph: '!', label: 'needs you', tone: 'attn' },
    failed: { glyph: '✕', label: 'failed', tone: 'fail' },
    passed: { glyph: '✓', label: 'passed', tone: 'pass' },
    blocked: { glyph: '⊘', label: 'blocked', tone: 'block' },
    skipped: { glyph: '–', label: 'skipped', tone: 'skip' },
    stopped: { glyph: '■', label: 'stopped', tone: 'quiet' },
    idle: { glyph: '○', label: 'idle', tone: 'quiet' },
    pending: { glyph: '○', label: 'not run', tone: 'quiet' },
  };
