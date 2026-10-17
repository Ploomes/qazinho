import type { IDeviceStep } from '@/modules/Device/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/constants';
import { DEVICE, DEVICE_STATE_KEY } from '@/modules/Device/constants';
import { deviceStateOf, formatElapsed, moodOfStatus } from '@/modules/Device/library';
import { useRunControls } from '@/modules/Run/hooks';
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
  const {
    steps: planSteps,
    live,
    isLive: isRunLive,
    isPaused,
    onPause,
    onStop,
  } = useRunControls();
  const [isResizing, setResizing] = useState(false);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const state = deviceStateOf(workspace);
  const isPhone = workspace?.planKind === 'mobile';

  const steps: IDeviceStep[] = planSteps.map((step, index) => ({
    number: index + 1,
    action: step.action,
    verdict:
      live?.outcomes.find((outcome) => outcome.index === index)?.verdict ??
      (live?.doingIndex === index ? 'running' : 'pending'),
  }));

  return {
    isOpen,
    width,
    panelWidth: isOpen ? width : DEVICE.railWidth,
    // A drag has to follow the pointer; easing each move would leave the panel behind it.
    widthTransition: isResizing
      ? { duration: 0 }
      : { duration: MOTION.durationSlow, ease: MOTION.ease },
    innerStyle: { '--device-width': `${String(width)}px` } as CSSProperties,
    isPhone,
    // A stopped run with nothing captured has no screen worth keeping up.
    hasScreen: isRunLive || (live?.shot ?? null) !== null,
    hasControls: isRunLive,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    stateText: t(DEVICE_STATE_KEY[state] as never),
    mood: moodOfStatus(workspace?.status ?? null),
    deviceLabel: isPhone ? 'Emulator · Pixel 7 · API 34' : 'Chrome 1280 × 800',
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
