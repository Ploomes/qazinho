import { MOTION } from '@/shared/constants';

export const STORAGE_MOTION = {
  stack: {
    hidden: {},
    shown: { transition: { staggerChildren: MOTION.stagger, delayChildren: 0.04 } },
  },
  item: {
    hidden: { opacity: 0, y: 6 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION.duration, ease: MOTION.ease },
    },
  },
  bar: {
    hidden: { clipPath: 'inset(0 100% 0 0)' },
    shown: {
      clipPath: 'inset(0 0% 0 0)',
      transition: { duration: MOTION.durationSlow * 2, ease: MOTION.ease },
    },
  },
  calmBar: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: MOTION.duration } },
  },
  grow: { duration: MOTION.durationSlow, ease: MOTION.ease },
  still: { duration: 0 },
} as const;
