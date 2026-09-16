import { useEffect } from 'react';
import { useRunTicker } from '@/hooks';
import { useAppStore } from '@/store';

export const useAppViewModel = () => {
  const theme = useAppStore((state) => state.theme);
  const screen = useAppStore((state) => state.screen);
  const projects = useAppStore((state) => state.projects);
  const modal = useAppStore((state) => state.modal);

  useRunTicker();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return {
    screen,
    modal,
    hasProjects: projects.length > 0,
    isWelcome: screen === 'welcome' || projects.length === 0,
    isWorkspace: screen === 'workspace',
    isSettings: screen === 'settings',
  };
};
