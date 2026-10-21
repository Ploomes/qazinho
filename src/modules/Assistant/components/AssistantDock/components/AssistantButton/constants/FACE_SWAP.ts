import { MOTION, STICKER } from '@/shared/constants';

export const FACE_SWAP = {
  initial: { opacity: 0, scale: 0.4, rotate: -90 },
  animate: { opacity: 1, scale: 1, rotate: 0, transition: STICKER.spring },
  exit: {
    opacity: 0,
    scale: 0.4,
    rotate: 90,
    transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
  },
} as const;
