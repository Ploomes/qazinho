import type { TargetAndTransition } from 'motion/react';
import { MOTION } from '@/shared/constants';

export const FACE_HOP: TargetAndTransition = {
  opacity: 1,
  scale: [1, 1.2, 1],
  y: [0, -2, 0],
  transition: {
    duration: MOTION.durationSlow,
    ease: 'easeInOut',
    opacity: { duration: MOTION.durationPress },
  },
};
