import { MOTION } from '@/shared/constants';
import { NEW_PROJECT_SCREEN } from './NEW_PROJECT_SCREEN';

export const STEP_SLIDE = {
  enter: (direction: number) => ({
    opacity: 0,
    x: NEW_PROJECT_SCREEN.slidePx * direction,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: -NEW_PROJECT_SCREEN.slidePx * direction,
    transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
  }),
};
