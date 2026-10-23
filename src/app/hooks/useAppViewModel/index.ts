import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import {
  ASSISTANT_DOCK,
  dockRoomOf,
  useAppActions,
  useAssistantEvents,
} from '@/modules/Assistant';
import { useSuiteWatch } from '@/modules/Automation';
import { useBuildEvents } from '@/modules/Build';
import { AppWindow, Platform } from '@/services';
import { SHELL } from '@/shared/constants';
import {
  useArchive,
  useKeybinds,
  useLanguage,
  useMachineWatch,
  useRunEvents,
  useRunTicker,
  useSidebarWidth,
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
  const isPanelOpen = useWorkspaceStore((state) => state.isPanelOpen);
  const sidebarWidth = useSidebarWidth();
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
  useSuiteWatch();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    if (Platform.isMac()) return;

    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--panel').trim();
    const symbolColor = style.getPropertyValue('--ink2').trim();

    if (color !== '' && symbolColor !== '')
      AppWindow.paintControls({ color, symbolColor });
  }, [theme]);

  useEffect(() => {
    AppWindow.fit(hasOnboarded ? 'app' : 'onboarding');
  }, [hasOnboarded]);

  return {
    shellStyle: {
      '--sidebar-width': `${String(SHELL.sidebarWidth)}px`,
      '--sidebar-shown': `${String(sidebarWidth)}px`,
      '--dock-room': `${String(dockRoomOf({ isWorkspace: screen === 'workspace' && projects.length > 0, isPanelOpen }))}px`,
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
    isAutomation: screen === 'automation',
  };
};
