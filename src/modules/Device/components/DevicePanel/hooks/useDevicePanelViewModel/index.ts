import type { IDeviceStep, IViewportChoice, ViewportId } from '@/modules/Device/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEVICE, DEVICE_STATE_KEY, VIEWPORTS } from '@/modules/Device/constants';
import {
  deviceStateOf,
  formatElapsed,
  moodOfStatus,
  stepVerdictsOf,
  viewportOf,
} from '@/modules/Device/library';
import { formatCost, useRunControls } from '@/modules/Run';
import { Run } from '@/services';
import { MOTION, SHELL } from '@/shared/constants';
import { useSelectedWorkspace } from '@/shared/hooks/useSelectedWorkspace';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useDevicePanelViewModel = () => {
  const { t, i18n } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const workspace = useSelectedWorkspace();
  const isOpen = useWorkspaceStore((state) => state.isDevicePanelOpen);
  const width = useWorkspaceStore((state) => state.deviceWidth);
  const toggleDevicePanel = useWorkspaceStore((state) => state.toggleDevicePanel);
  const setDevicePanelOpen = useWorkspaceStore((state) => state.setDevicePanelOpen);
  const setDeviceWidth = useWorkspaceStore((state) => state.setDeviceWidth);
  const setViewport = useWorkspaceStore((state) => state.setViewport);
  const {
    steps: planSteps,
    live,
    isLive: isRunLive,
    isPaused,
    onPause,
    onStop,
  } = useRunControls();
  const windowWidth = useWindowWidth();
  const [isResizing, setResizing] = useState(false);
  const [isFocusedNow, setFocused] = useState(false);

  const fitted = Math.max(
    DEVICE.minWidth,
    Math.min(
      width,
      windowWidth - SHELL.sidebarWidth - SHELL.centerMinWidth - DEVICE.handleWidth,
    ),
  );
  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const state = deviceStateOf(workspace);
  const isPhone = workspace?.planKind === 'mobile';
  const viewport = viewportOf(workspace?.viewportId);

  const lastRun = workspace?.runs[0] ?? null;
  const verdicts = stepVerdictsOf({ steps: planSteps, live, lastRun });
  const steps: IDeviceStep[] = planSteps.map((step, index) => ({
    number: index + 1,
    action: step.action,
    verdict: verdicts[index] ?? 'pending',
  }));
  const walked =
    live?.outcomes.length ??
    lastRun?.cases.reduce((total, runCase) => total + runCase.steps.length, 0) ??
    null;

  const hasScreen = isRunLive || (live?.shot ?? null) !== null;
  const isFocused = isFocusedNow && hasScreen;
  const stream = live?.isDone === false ? live.streamUrl : null;
  const viewports: IViewportChoice[] = isPhone
    ? []
    : VIEWPORTS.map((option) => ({
        id: option.id,
        label: t(option.labelKey),
        size: `${String(option.width)} × ${String(option.height)}`,
        isActive: option.id === viewport.id,
      }));
  const workspaceId = workspace?.id ?? null;

  useEffect(() => {
    setDevicePanelOpen(isRunLive);
  }, [workspaceId, isRunLive, setDevicePanelOpen]);

  useEffect(() => {
    if (workspaceId === null || stream === null || !isFocused) return;

    Run.focus({ workspaceId, isFocused: true });

    return () => {
      Run.focus({ workspaceId, isFocused: false });
    };
  }, [workspaceId, stream, isFocused]);

  return {
    isOpen,
    isFocused,
    canFocus: hasScreen && !isFocused,
    focusLabel: t('DEVICE.FOCUS'),
    focusLabelClassName:
      fitted < DEVICE.compactWidth
        ? 'device-panel__focus-label device-panel__focus-label--hidden'
        : 'device-panel__focus-label',
    focusedText: t('DEVICE.FOCUSED'),
    frameLayoutId: DEVICE.frameLayoutId,
    frameTransition: { duration: MOTION.durationSlow, ease: MOTION.ease },
    onFocus: () => {
      setFocused(true);
    },
    onUnfocus: () => {
      setFocused(false);
    },
    width: fitted,
    panelWidth: isOpen ? fitted + DEVICE.handleWidth : DEVICE.railWidth,
    panelClassName: isResizing ? 'device-panel device-panel--resizing' : 'device-panel',
    widthTransition: isResizing
      ? { duration: 0 }
      : { duration: MOTION.durationSlow, ease: MOTION.ease },
    panelStyle: {
      '--device-width': `${String(fitted)}px`,
      '--device-handle': `${String(DEVICE.handleWidth)}px`,
      '--device-rail': `${String(DEVICE.railWidth)}px`,
      '--device-header': `${String(DEVICE.headerHeight)}px`,
      '--device-chrome': `${String(DEVICE.chromeHeight)}px`,
      '--device-ratio': String(viewport.width / viewport.height),
      '--device-steps-min': `${String(DEVICE.stepsMinHeight)}px`,
    } as CSSProperties,
    isPhone,
    hasScreen,
    viewportClassName:
      !hasScreen || isFocused
        ? 'device-panel__viewport'
        : isPhone
          ? 'device-panel__viewport device-panel__viewport--fill'
          : 'device-panel__viewport device-panel__viewport--browser',
    hasControls: isRunLive,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    stateText: t(DEVICE_STATE_KEY[state] as never),
    mood: moodOfStatus(workspace?.status ?? null),
    viewports,
    hasViewportPicker: viewports.length > 0 && !isFocused,
    viewportLayoutId: DEVICE.panelViewportLayoutId,
    viewportNote: isRunLive ? '' : t('DEVICE.VIEWPORT_NEXT'),
    screenRatio: viewport.width / viewport.height,
    onSelectViewport: (viewportId: ViewportId) => {
      if (!workspace || viewportId === viewport.id) return;

      setViewport({ workspaceId: workspace.id, viewportId });

      if (isRunLive) {
        const picked = viewportOf(viewportId);

        Run.resize({
          workspaceId: workspace.id,
          viewport: { width: picked.width, height: picked.height },
        });
      }
    },
    shot: live?.shot ?? null,
    stream,
    urlText: target?.value ?? '',
    elapsedLabel:
      live?.costUsd == null
        ? t('DEVICE.LIVE', { elapsed: formatElapsed(live?.elapsedSec ?? 0) })
        : t('DEVICE.LIVE_COST', {
            elapsed: formatElapsed(live.elapsedSec),
            cost: formatCost({ costUsd: live.costUsd, language: i18n.language }),
          }),
    isLive: state === 'driving',
    steps,
    doingLabel:
      walked === null
        ? ''
        : t('DEVICE.STEPS_PROGRESS', { done: walked, total: steps.length }),
    onToggle: toggleDevicePanel,
    onResize: setDeviceWidth,
    onResizeStart: () => {
      setResizing(true);
    },
    onResizeEnd: () => {
      setResizing(false);
    },
    onPause,
    onStop,
  };
};
