import type { IDeviceStep, ViewportId } from '@/modules/Device/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEVICE, DEVICE_STATE_KEY, VIEWPORTS } from '@/modules/Device/constants';
import {
  deviceStateOf,
  formatElapsed,
  moodOfStatus,
  viewportOf,
} from '@/modules/Device/library';
import { useRunControls } from '@/modules/Run';
import { Run } from '@/services';
import { MOTION } from '@/shared/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useDevicePanelViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const projects = useAppStore((state) => state.projects);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isOpen = useWorkspaceStore((state) => state.isDevicePanelOpen);
  const width = useWorkspaceStore((state) => state.deviceWidth);
  const toggleDevicePanel = useWorkspaceStore((state) => state.toggleDevicePanel);
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
  const [isResizing, setResizing] = useState(false);
  const [isFocusedNow, setFocused] = useState(false);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const state = deviceStateOf(workspace);
  const isPhone = workspace?.planKind === 'mobile';
  const viewport = viewportOf(workspace?.viewportId);

  const steps: IDeviceStep[] = planSteps.map((step, index) => ({
    number: index + 1,
    action: step.action,
    verdict:
      live?.outcomes.find((outcome) => outcome.index === index)?.verdict ??
      (live?.doingIndex === index ? 'running' : 'pending'),
  }));

  const hasScreen = isRunLive || (live?.shot ?? null) !== null;
  const isFocused = isFocusedNow && hasScreen;

  return {
    isOpen,
    isFocused,
    canFocus: hasScreen && !isFocused,
    focusLabel: t('DEVICE.FOCUS'),
    focusedText: t('DEVICE.FOCUSED'),
    frameLayoutId: DEVICE.frameLayoutId,
    frameTransition: { duration: MOTION.durationSlow, ease: MOTION.ease },
    onFocus: () => {
      setFocused(true);
    },
    onUnfocus: () => {
      setFocused(false);
    },
    width,
    panelWidth: isOpen ? width : DEVICE.railWidth,
    widthTransition: isResizing
      ? { duration: 0 }
      : { duration: MOTION.durationSlow, ease: MOTION.ease },
    innerStyle: { '--device-width': `${String(width)}px` } as CSSProperties,
    isPhone,
    hasScreen,
    hasControls: isRunLive,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    stateText: t(DEVICE_STATE_KEY[state] as never),
    mood: moodOfStatus(workspace?.status ?? null),
    viewports: isPhone
      ? []
      : VIEWPORTS.map((option) => ({
          id: option.id,
          label: t(option.labelKey),
          size: `${String(option.width)} × ${String(option.height)}`,
          isActive: option.id === viewport.id,
        })),
    viewportNote: isRunLive ? '' : t('DEVICE.VIEWPORT_NEXT'),
    focusRatio: viewport.width / viewport.height,
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
    stream: live?.isDone === false ? live.streamUrl : null,
    urlText: target?.value ?? '',
    elapsedLabel: t('DEVICE.LIVE', { elapsed: formatElapsed(live?.elapsedSec ?? 0) }),
    isLive: state === 'driving',
    steps,
    doingLabel:
      live === null ? '' : `${String(live.outcomes.length)} of ${String(steps.length)}`,
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
