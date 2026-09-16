import type { IDeviceStep } from '@/modules/Device/types';
import { useTranslation } from 'react-i18next';
import { DEVICE } from '@/modules/Device/constants';
import { deviceStateOf, formatElapsed } from '@/modules/Device/library';
import { flattenPlanSteps, verdictForStep } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';

const STATE_KEY = {
  off: 'DEVICE.IDLE',
  driving: 'DEVICE.DRIVING',
  holding: 'DEVICE.HOLDING',
  stopped: 'DEVICE.STOPPED',
} as const;

export const useDevicePanelViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isOpen = useWorkspaceStore((state) => state.isDevicePanelOpen);
  const width = useWorkspaceStore((state) => state.deviceWidth);
  const toggleDevicePanel = useWorkspaceStore((state) => state.toggleDevicePanel);
  const setDeviceWidth = useWorkspaceStore((state) => state.setDeviceWidth);
  const pauseRun = useWorkspaceStore((state) => state.pauseRun);
  const stopRun = useWorkspaceStore((state) => state.stopRun);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const workspaceId = workspace?.id ?? null;
  const state = deviceStateOf(workspace);
  const live = workspace?.live ?? null;
  const isPhone = workspace?.planKind === 'mobile';

  const steps: IDeviceStep[] = flattenPlanSteps(workspace?.plan ?? []).map(
    (step, index) => ({
      number: index + 1,
      action: step.action,
      verdict:
        live === null || index >= live.stepIndex
          ? index === (live?.stepIndex ?? -1)
            ? 'running'
            : 'pending'
          : verdictForStep(index + 1),
    }),
  );

  return {
    isOpen,
    width,
    railWidth: DEVICE.railWidth,
    isPhone,
    isOff: state === 'off',
    stateText: t(STATE_KEY[state]),
    deviceLabel: isPhone ? 'Emulator · Pixel 7 · API 34' : 'Chromium 1280 × 800',
    streamText: isPhone
      ? 'live emulator stream\n1080 × 2400 · 30 fps'
      : 'live browser stream\n1280 × 800 · 30 fps',
    elapsedLabel: t('DEVICE.LIVE', { elapsed: formatElapsed(live?.elapsedSec ?? 0) }),
    isLive: state === 'driving',
    steps,
    doingLabel:
      live === null ? '' : `${String(live.stepIndex)} of ${String(steps.length)}`,
    onToggle: toggleDevicePanel,
    onResize: setDeviceWidth,
    onPause: () => {
      if (workspaceId !== null) pauseRun(workspaceId);
    },
    onStop: () => {
      if (workspaceId !== null) stopRun(workspaceId);
    },
  };
};
