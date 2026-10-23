import { MOTION, STICKER } from '@/shared/constants';

export const FACE_SWAP = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1, transition: STICKER.spring },
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
  },
} as const;
