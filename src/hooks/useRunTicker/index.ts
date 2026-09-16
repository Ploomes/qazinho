import { useEffect } from 'react';
import { RUN_ENGINE } from '@/modules/Run/constants';
import { useWorkspaceStore } from '@/store';

/** Drives every live run in the app: one tick, all workspaces, so parallel runs stay in step. */
export const useRunTicker = () => {
  const tick = useWorkspaceStore((state) => state.tick);

  useEffect(() => {
    const id = window.setInterval(tick, RUN_ENGINE.tickSeconds * 1000);

    return () => window.clearInterval(id);
  }, [tick]);
};
