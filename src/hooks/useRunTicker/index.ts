import { useEffect } from 'react';
import { RUN_CLOCK } from '@/modules/Run';
import { useWorkspaceStore } from '@/store';

export const useRunTicker = () => {
  const tickClock = useWorkspaceStore((state) => state.tickClock);

  useEffect(() => {
    const id = window.setInterval(tickClock, RUN_CLOCK.tickMs);

    return () => window.clearInterval(id);
  }, [tickClock]);
};
