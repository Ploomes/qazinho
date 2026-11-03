import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useAppActions, useAssistantEvents, useQuestionRoom } from '@/modules/Assistant';
import { useBuildEvents } from '@/modules/Build';
import { useIslandSync } from '@/modules/Island';
import { useOutsideCalls } from '@/modules/Outside';
import { useProLinks, useProSync } from '@/modules/Pro';
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
  useSidebarWidth,
  useVariables,
  useVideoSweep,
} from '@/shared/hooks';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useUpdateStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useAppViewModel = () => {
  const isChatOnly = useChatOnly();
  const theme = useAppStore((state) => state.theme);
  const screen = useAppStore((state) => state.screen);
  const projects = useAppStore((state) => state.projects);
  const modal = useAppStore((state) => state.modal);
  const editingProjectId = useAppStore((state) => state.editingProjectId);
  const media = useAppStore((state) => state.media);
  const replay = useAppStore((state) => state.replay);
  const runNotice = useAppStore((state) => state.runNotice);
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

  useArchive();
  useVariables();
  useLanguage();
  useKeybinds();
  useRunTicker();
  useRunEvents();
  useMachineWatch();
  useAppActions();
  useAssistantEvents();
  useQuestionRoom();
  useBuildEvents();
  useProSync();
  useProLinks();
  useVideoSweep();
  useIslandSync();
  useOutsideCalls();
  useUpdateWatch();

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
    } as CSSProperties,
    screen,
    modal,
    projectModalKey: `project-${editingProjectId ?? 'new'}`,
    variablesKey,
    hasMedia: media !== null,
    hasRunNotice: runNotice !== null,
    runNoticeKey: runNotice?.key ?? 'run-notice',
    hasReplay: replay !== null,
    hasProLink,
    hasProMerge,
    hasHeldRun,
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
    isTitlebarBare: isUpdateBlocked || !hasOnboarded,
    isOnboarding: !hasOnboarded,
    hasSidebar: projects.length > 0 && screen !== 'settings',
    isWelcome: screen !== 'settings' && (screen === 'welcome' || projects.length === 0),
    isWorkspace: screen === 'workspace',
    isChatOnly,
    isSettings: screen === 'settings',
  };
};
