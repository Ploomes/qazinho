import { MOTION } from '@/shared/constants';

export const FOLD = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
  },
} as const;
