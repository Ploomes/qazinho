import { MOTION } from '@/shared/constants';

export const PANE_MOTION = {
  open: {
    opacity: 1,
    y: 0,
    visibility: 'visible',
    transition: {
      duration: MOTION.duration,
      ease: MOTION.ease,
      delay: MOTION.durationFast / 2,
    },
  },
  shut: {
    opacity: 0,
    y: 6,
    visibility: 'hidden',
    transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
  },
} as const;
