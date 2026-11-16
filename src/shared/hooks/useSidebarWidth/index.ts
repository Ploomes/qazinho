import { SHELL } from '@/shared/constants';
import { useSettingsStore } from '@/store';

export const useSidebarWidth = (): number => {
  const isShut = useSettingsStore((state) => state.isSidebarShut);

  return isShut ? SHELL.sidebarRail : SHELL.sidebarRail + SHELL.sidebarWidth;
};
