import { useEffect } from 'react';
import { AppWindow } from '@/services';
import {
  useArchive,
  useKeybinds,
  useLanguage,
  useMachineWatch,
  useRunEvents,
  useRunTicker,
} from '@/shared/hooks';
import { useAppStore, useSettingsStore } from '@/store';

export const useAppViewModel = () => {
  const theme = useAppStore((state) => state.theme);
  const screen = useAppStore((state) => state.screen);
  const projects = useAppStore((state) => state.projects);
  const modal = useAppStore((state) => state.modal);
  const media = useAppStore((state) => state.media);
  const hasOnboarded = useSettingsStore((state) => state.hasOnboarded);

  useArchive();
  useLanguage();
  useKeybinds();
  useRunTicker();
  useRunEvents();
  useMachineWatch();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    AppWindow.fit(hasOnboarded ? 'app' : 'onboarding');
  }, [hasOnboarded]);

  return {
    screen,
    modal,
    hasMedia: media !== null,
    isOnboarding: !hasOnboarded,
    hasSidebar: projects.length > 0 && screen !== 'settings',
    isWelcome: screen !== 'settings' && (screen === 'welcome' || projects.length === 0),
    isWorkspace: screen === 'workspace',
    isSettings: screen === 'settings',
  };
};
