import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import {
  ASSISTANT_DOCK,
  dockRoomOf,
  useAppActions,
  useAssistantEvents,
} from '@/modules/Assistant';
import { useBuildEvents } from '@/modules/Build';
import { AppWindow } from '@/services';
import { SHELL } from '@/shared/constants';
import {
  useArchive,
  useKeybinds,
  useLanguage,
  useMachineWatch,
  useRunEvents,
  useRunTicker,
  useVariables,
} from '@/shared/hooks';
import {
  useAppStore,
  useSettingsStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useAppViewModel = () => {
  const theme = useAppStore((state) => state.theme);
  const screen = useAppStore((state) => state.screen);
  const projects = useAppStore((state) => state.projects);
  const modal = useAppStore((state) => state.modal);
  const media = useAppStore((state) => state.media);
  const replay = useAppStore((state) => state.replay);
  const runNotice = useAppStore((state) => state.runNotice);
  const hasOnboarded = useSettingsStore((state) => state.hasOnboarded);
  const isDeviceOpen = useWorkspaceStore((state) => state.isDevicePanelOpen);
  const variablesKey = useVariablesStore((state) => state.request?.id ?? null);

  useArchive();
  useVariables();
  useLanguage();
  useKeybinds();
  useRunTicker();
  useRunEvents();
  useMachineWatch();
  useAppActions();
  useAssistantEvents();
  useBuildEvents();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    AppWindow.fit(hasOnboarded ? 'app' : 'onboarding');
  }, [hasOnboarded]);

  return {
    shellStyle: {
      '--sidebar-width': `${String(SHELL.sidebarWidth)}px`,
      '--dock-room': `${String(dockRoomOf({ isWorkspace: screen === 'workspace' && projects.length > 0, isDeviceOpen }))}px`,
      '--dock-lift': `${String(ASSISTANT_DOCK.inset + ASSISTANT_DOCK.buttonSize)}px`,
    } as CSSProperties,
    screen,
    modal,
    variablesKey,
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
