import type { IScreenRailProps } from '@/modules/Device/components/DeviceView/components/ScreenRail/types';
import { useEffect, useState } from 'react';
import { DEVICE } from '@/modules/Device/constants';

export const useScreenRailViewModel = (props: IScreenRailProps) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((current) => current + 1);
    }, DEVICE.railRefreshMs);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return {
    screens: props.screens.map((screen) => ({
      ...screen,
      picture:
        screen.streamUrl === null ? null : `${screen.streamUrl}?still=${String(tick)}`,
      className: screen.isShown
        ? 'screen-rail__screen screen-rail__screen--shown'
        : 'screen-rail__screen',
    })),
  };
};
