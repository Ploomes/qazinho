import { useAnimationControls } from 'motion/react';
import { useEffect, useRef } from 'react';
import { DEVICE } from '@/modules/Device/constants';
import { MOTION } from '@/shared/constants';

export const useScreenSwap = (props: { shownKey: string; isOn: boolean }) => {
  const { shownKey, isOn } = props;
  const swap = useAnimationControls();
  const shownBefore = useRef(shownKey);

  useEffect(() => {
    if (shownBefore.current === shownKey) return;

    shownBefore.current = shownKey;

    if (!isOn) return;

    swap.set(DEVICE.swapFrom);
    void swap.start({
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: MOTION.durationSlow, ease: MOTION.ease },
    });
  }, [shownKey, isOn, swap]);

  return swap;
};
