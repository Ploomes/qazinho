import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppActions, useAssistantEvents, useQuestionRoom } from '@/modules/Assistant';
import { useBuildEvents } from '@/modules/Build';
import { usePlanQueue } from '@/modules/Home';
import { useIslandSync } from '@/modules/Island';
import { useMemoryKeeping } from '@/modules/Memory/hooks/useMemoryKeeping';
import { useOutsideCalls } from '@/modules/Outside';
import { useProLinks, useProSync } from '@/modules/Pro';
import { useProjectNaming } from '@/modules/Project';
import { useSkills } from '@/modules/Skills';
import { useTemplates } from '@/modules/Template';
import { isRunGoing, useUpdateWatch } from '@/modules/Update';
import { useChatOnly } from '@/modules/Workspace';
import { AppWindow, Platform } from '@/services';
import { SHELL } from '@/shared/constants';
import {
  useArchive,
  useKeybinds,
  useLanguage,
  useMachineWatch,
  useRunEvents,
  useRunTicker,
  useSidebarFit,
  useSidebarWidth,
  useSystemTheme,
  useVariables,
  useVideoSweep,
  useWindowDock,
} from '@/shared/hooks';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useUpdateStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';
import { shownThemeOf } from '@/store/AppStore/library';

export const useAppViewModel = () => {
  const { t } = useTranslation();
  const isChatOnly = useChatOnly();
  const theme = useAppStore(shownThemeOf);
  const screen = useAppStore((state) => state.screen);
  const projects = useAppStore((state) => state.projects);
  const isLoaded = useAppStore((state) => state.isLoaded);
  const modal = useAppStore((state) => state.modal);
  const editingProjectId = useAppStore((state) => state.editingProjectId);
  const media = useAppStore((state) => state.media);
  const replay = useAppStore((state) => state.replay);
  const isSearchOpen = useAppStore((state) => state.isSearchOpen);
  const isDocked = useAppStore((state) => state.dock !== null);
  const hasOnboarded = useSettingsStore((state) => state.hasOnboarded);
  const isUpdateRequired = useUpdateStore((state) => state.update.isRequired);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isUpdateBlocked = isUpdateRequired && !isRunGoing(workspaces);
  const sidebarWidth = useSidebarWidth();
  const variablesKey = useVariablesStore((state) => state.request?.id ?? null);
  const hasProLink = useProStore((state) => state.link !== null);
  const hasProMerge = useProStore((state) => state.merging !== null);
  const hasHeldRun = useProStore(
    (state) => state.heldRun !== null && state.merging === null,
  );
  const hasChangeHold = useWorkspaceStore((state) => state.changeHold !== null);

  useArchive();
  useVariables();
  useSkills();
  useTemplates();
  usePlanQueue();
  useLanguage();
  useKeybinds();
  useRunTicker();
  useRunEvents();
  useMachineWatch();
  useAppActions();
  useAssistantEvents();
  useQuestionRoom();
  useBuildEvents();
  useMemoryKeeping();
  useProSync();
  useProLinks();
  useVideoSweep();
  useIslandSync();
  useOutsideCalls();
  useUpdateWatch();
  useProjectNaming();
  useSidebarFit();
  useSystemTheme();
  useWindowDock();

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

  useEffect(() => {
    if (Platform.isMac()) return;

    AppWindow.labelTray({ open: t('TRAY.OPEN'), quit: t('TRAY.QUIT') });
  }, [t]);

  return {
    shellStyle: {
      '--sidebar-width': `${String(SHELL.sidebarWidth)}px`,
      '--sidebar-shown': `${String(sidebarWidth)}px`,
    } as CSSProperties,
    screen,
    modal,
    projectModalKey: `project-${editingProjectId ?? 'new'}`,
    variablesKey,
    hasMedia: media !== null,
    hasSearch: isSearchOpen && projects.length > 0,
    hasReplay: replay !== null,
    hasProLink,
    hasProMerge,
    hasHeldRun,
    hasChangeHold,
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
    isUpdateBlocked,
    isDocked: isDocked && !isUpdateBlocked,
    isTitlebarBare: isUpdateBlocked || !hasOnboarded,
    isOnboarding: !hasOnboarded,
    hasSidebar: projects.length > 0 && screen !== 'settings',
    cardClassName:
      hasOnboarded && !isUpdateBlocked && projects.length > 0 && screen !== 'settings'
        ? 'app__card'
        : 'app__card app__card--alone',
    isFirstRun: isLoaded && screen !== 'settings' && projects.length === 0,
    isHome: screen === 'welcome' && projects.length > 0,
    isWorkspace: screen === 'workspace',
    isChatOnly,
    isSettings: screen === 'settings',
    isNewProject: screen === 'newProject',
    isBugs: screen === 'bugs',
  };
};
