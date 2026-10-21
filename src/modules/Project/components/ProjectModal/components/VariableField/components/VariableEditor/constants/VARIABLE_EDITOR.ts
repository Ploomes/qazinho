import { MOTION } from '@/shared/constants';

export const VARIABLE_EDITOR = {
  scrollAfterMs: Math.round(MOTION.duration * 1_000) + 40,
} as const;
