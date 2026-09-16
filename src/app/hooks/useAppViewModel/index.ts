import { useEffect } from 'react';
import {
  useArchive,
  useKeybinds,
  useMachineWatch,
  useRunEvents,
  useRunTicker,
} from '@/hooks';
import { useAppStore } from '@/store';

export const useAppViewModel = () => {
  const theme = useAppStore((state) => state.theme);
  const screen = useAppStore((state) => state.screen);
  const projects = useAppStore((state) => state.projects);
  const modal = useAppStore((state) => state.modal);

  useArchive();
  useKeybinds();
  useRunTicker();
  useRunEvents();
  useMachineWatch();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return {
    screen,
    modal,
    hasSidebar: projects.length > 0 && screen !== 'settings',
    isWelcome: screen === 'welcome' || projects.length === 0,
    isWorkspace: screen === 'workspace',
    isSettings: screen === 'settings',
  };
};
