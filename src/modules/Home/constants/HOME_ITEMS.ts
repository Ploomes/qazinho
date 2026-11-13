import type { HomeItemKind } from '@/modules/Home/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';

export const HOME_ITEMS: Record<
  HomeItemKind,
  { icon: IconName; tone: string; animation: string }
> = {
  asking: {
    icon: 'attention',
    tone: 'var(--attn)',
    animation: 'gc-blink 2.4s ease-in-out infinite',
  },
  running: {
    icon: 'running',
    tone: 'var(--accent-ink)',
    animation: 'gc-pulse 1.8s ease-in-out infinite',
  },
  paused: { icon: 'paused', tone: 'var(--attn)', animation: 'none' },
  toContinue: { icon: 'paused', tone: 'var(--attn)', animation: 'none' },
  failed: { icon: 'failed', tone: 'var(--fail)', animation: 'none' },
  arrived: { icon: 'redirect', tone: 'var(--accent-ink)', animation: 'none' },
  answered: { icon: 'ask', tone: 'var(--attn)', animation: 'none' },
  changed: { icon: 'reload', tone: 'var(--attn)', animation: 'none' },
  byHand: { icon: 'manual', tone: 'var(--ink2)', animation: 'none' },
  toDevelop: { icon: 'pending', tone: 'var(--ink3)', animation: 'none' },
};
