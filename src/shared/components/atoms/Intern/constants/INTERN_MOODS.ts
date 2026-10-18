import type { InternMood } from '@/shared/components/atoms/Intern/types';

export const INTERN_MOODS: Record<
  InternMood,
  { loopMs: number; stillAt: number; labelKey: `MASCOT.MOOD_${string}` }
> = {
  neutral: { loopMs: 1800, stillAt: 0, labelKey: 'MASCOT.MOOD_NEUTRAL' },
  running: { loopMs: 1600, stillAt: 0.25, labelKey: 'MASCOT.MOOD_RUNNING' },
  passed: { loopMs: 1200, stillAt: 0.75, labelKey: 'MASCOT.MOOD_PASSED' },
  bug: { loopMs: 2000, stillAt: 0, labelKey: 'MASCOT.MOOD_BUG' },
  flaky: { loopMs: 2000, stillAt: 0.25, labelKey: 'MASCOT.MOOD_FLAKY' },
  thinking: { loopMs: 2000, stillAt: 0.9, labelKey: 'MASCOT.MOOD_THINKING' },
  broken: { loopMs: 1500, stillAt: 0.04, labelKey: 'MASCOT.MOOD_BROKEN' },
  sleeping: { loopMs: 2880, stillAt: 0.3, labelKey: 'MASCOT.MOOD_SLEEPING' },
};
