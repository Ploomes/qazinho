import { useEffect } from 'react';
import { RUN_CLOCK } from '@/modules/Run/constants';
import { useWorkspaceStore } from '@/store';

/** Drives every live run's clock: one tick, all workspaces, so parallel runs stay in step. */
export const useRunTicker = () => {
  const tickClock = useWorkspaceStore((state) => state.tickClock);

  useEffect(() => {
    const id = window.setInterval(tickClock, RUN_CLOCK.tickMs);

    return () => window.clearInterval(id);
  }, [tickClock]);
};
