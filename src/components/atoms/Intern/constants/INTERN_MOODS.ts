import type { InternMood } from '@/components/atoms/Intern/types';

/** How long one loop of each mood lasts, from the designer's animations, and the word for it. */
export const INTERN_MOODS: Record<
  InternMood,
  { loopMs: number; labelKey: `MASCOT.MOOD_${string}` }
> = {
  neutral: { loopMs: 1800, labelKey: 'MASCOT.MOOD_NEUTRAL' },
  running: { loopMs: 1600, labelKey: 'MASCOT.MOOD_RUNNING' },
  passed: { loopMs: 1200, labelKey: 'MASCOT.MOOD_PASSED' },
  bug: { loopMs: 2000, labelKey: 'MASCOT.MOOD_BUG' },
  flaky: { loopMs: 2000, labelKey: 'MASCOT.MOOD_FLAKY' },
  thinking: { loopMs: 2000, labelKey: 'MASCOT.MOOD_THINKING' },
  broken: { loopMs: 1500, labelKey: 'MASCOT.MOOD_BROKEN' },
  sleeping: { loopMs: 2880, labelKey: 'MASCOT.MOOD_SLEEPING' },
};
