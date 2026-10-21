import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useAppActions, useAssistantEvents } from '@/modules/Assistant';
import { AppWindow } from '@/services';
import { SHELL } from '@/shared/constants';
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
  const replay = useAppStore((state) => state.replay);
  const runNotice = useAppStore((state) => state.runNotice);
  const hasOnboarded = useSettingsStore((state) => state.hasOnboarded);

  useArchive();
  useLanguage();
  useKeybinds();
  useRunTicker();
  useRunEvents();
  useMachineWatch();
  useAppActions();
  useAssistantEvents();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    AppWindow.fit(hasOnboarded ? 'app' : 'onboarding');
  }, [hasOnboarded]);

  return {
    shellStyle: { '--sidebar-width': `${String(SHELL.sidebarWidth)}px` } as CSSProperties,
    screen,
    modal,
    hasMedia: media !== null,
    hasRunNotice: runNotice !== null,
    runNoticeKey: runNotice?.key ?? 'run-notice',
    hasReplay: replay !== null,
    replayKey:
      replay === null
        ? 'replay'
        : `replay:${replay.workspaceId}/${replay.runId}/${
            replay.focus.kind === 'case'
              ? replay.focus.caseId
              : replay.focus.kind === 'bug'
                ? replay.focus.bugId
                : 'run'
          }`,
    isOnboarding: !hasOnboarded,
    hasSidebar: projects.length > 0 && screen !== 'settings',
    isWelcome: screen !== 'settings' && (screen === 'welcome' || projects.length === 0),
    isWorkspace: screen === 'workspace',
    isSettings: screen === 'settings',
  };
};
