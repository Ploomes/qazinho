import { BUG_FLASH } from '@/modules/Device/constants';
import { MOTION } from '@/shared/constants';

const QUICK_OUT = { duration: BUG_FLASH.fadeOutS, ease: MOTION.easeIn };
const BACK_OUT = { duration: BUG_FLASH.exitS, ease: MOTION.easeIn };

export const BUG_FLASH_MOTION = {
  veil: {
    in: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: BUG_FLASH.veilS, ease: MOTION.ease } },
    out: { opacity: 0, transition: BACK_OUT },
  },
  stack: {
    in: { scale: 1 / BUG_FLASH.photoShare, y: BUG_FLASH.photoSink, opacity: 1 },
    shown: { scale: 1, y: 0, opacity: 1, transition: BUG_FLASH.spring },
    out: {
      scale: 1 / BUG_FLASH.photoShare,
      y: BUG_FLASH.photoSink,
      opacity: 0,
      transition: BACK_OUT,
    },
  },
  corner: {
    in: ({ x, y }: { x: number; y: number }) => ({
      x: x * BUG_FLASH.cornerFromPx,
      y: y * BUG_FLASH.cornerFromPx,
      opacity: 0,
    }),
    shown: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: { ...BUG_FLASH.lockSpring, delay: BUG_FLASH.cornerDelayS },
    },
    out: { opacity: 0, transition: QUICK_OUT },
  },
  caption: {
    in: { opacity: 0, y: 14 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { ...BUG_FLASH.lockSpring, delay: BUG_FLASH.captionDelayS },
    },
    out: { opacity: 0, transition: QUICK_OUT },
  },
} as const;
