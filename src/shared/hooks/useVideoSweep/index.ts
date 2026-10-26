import { useEffect } from 'react';
import { Storage } from '@/services';
import { VIDEO_SWEEP } from '@/shared/hooks/useVideoSweep/constants';
import { useSettingsStore } from '@/store';

export const useVideoSweep = () => {
  const days = useSettingsStore((state) => state.videoKeepDays);

  useEffect(() => {
    if (days === null) return;

    void Storage.sweepVideos(days);
    const timer = window.setInterval(() => {
      void Storage.sweepVideos(days);
    }, VIDEO_SWEEP.everyMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [days]);
};
