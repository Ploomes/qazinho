import { MOTION } from '@/shared/constants';

export const SIDEBAR_NAME_MOTION = {
  initial: { clipPath: 'inset(0 100% 0 0)', opacity: 0.4 },
  animate: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: { duration: MOTION.durationSlow * 2, ease: MOTION.ease },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
  },
} as const;
