import type { IWindowDock } from '@/shared/types';
import { useEffect } from 'react';
import { AppWindow } from '@/services';
import { useAppStore } from '@/store';

export const useWindowDock = () => {
  const setDock = useAppStore((state) => state.setDock);

  useEffect(() => {
    const land = (dock: IWindowDock | null) => {
      if (dock !== null) useAppStore.getState().selectWorkspace(dock.workspaceId);

      setDock(dock);
    };

    void AppWindow.dock().then(land);

    return AppWindow.onDock(land);
  }, [setDock]);
};
