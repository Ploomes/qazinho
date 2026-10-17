import type { WorkspaceStatus } from '@/modules/Workspace';

export const SIDEBAR_STATUS: Record<
  WorkspaceStatus,
  { glyph: string; tone: string; animation: string }
> = {
  running: {
    glyph: '▸',
    tone: 'var(--lime-ink)',
    animation: 'gc-pulse 1.8s ease-in-out infinite',
  },
  attention: {
    glyph: '!',
    tone: 'var(--attn)',
    animation: 'gc-blink 2.4s ease-in-out infinite',
  },
  failed: { glyph: '✕', tone: 'var(--fail)', animation: 'none' },
  passed: { glyph: '✓', tone: 'var(--pass)', animation: 'none' },
  stopped: { glyph: '■', tone: 'var(--ink3)', animation: 'none' },
  idle: { glyph: '○', tone: 'var(--ink3)', animation: 'none' },
};
