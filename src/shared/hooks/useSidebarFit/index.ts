import { useEffect, useRef } from 'react';
import { SHELL } from '@/shared/constants';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useSettingsStore } from '@/store';

export const useSidebarFit = () => {
  const isNarrow = useWindowWidth() < SHELL.sidebarFoldBelow;
  const isShut = useSettingsStore((state) => state.isSidebarShut);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);
  const wasNarrow = useRef<boolean | null>(null);
  const isFoldedByWidth = useRef(false);

  useEffect(() => {
    if (wasNarrow.current === isNarrow) return;

    wasNarrow.current = isNarrow;

    if (isNarrow && !isShut) {
      isFoldedByWidth.current = true;
      toggleSidebar();

      return;
    }

    if (!isNarrow && isFoldedByWidth.current) {
      isFoldedByWidth.current = false;

      if (isShut) toggleSidebar();
    }
  }, [isNarrow, isShut, toggleSidebar]);
};
