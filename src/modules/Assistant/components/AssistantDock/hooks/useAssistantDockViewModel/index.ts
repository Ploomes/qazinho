import type { CSSProperties } from 'react';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { devicePanelWidthOf } from '@/modules/Device/library';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useAppStore, useAssistantStore, useWorkspaceStore } from '@/store';

export const useAssistantDockViewModel = () => {
  const isOpen = useAssistantStore((state) => state.isOpen);
  const hasDevice = useAppStore(
    (state) => state.screen === 'workspace' && state.projects.length > 0,
  );
  const isDeviceOpen = useWorkspaceStore((state) => state.isDevicePanelOpen);
  const deviceWidth = useWorkspaceStore((state) => state.deviceWidth);
  const windowWidth = useWindowWidth();
  const shift =
    hasDevice && isDeviceOpen
      ? devicePanelWidthOf({ width: deviceWidth, windowWidth, isOpen: true }).outer
      : 0;

  return {
    isOpen,
    style: {
      '--assistant-button': `${String(ASSISTANT_DOCK.buttonSize)}px`,
      '--assistant-badge': `${String(ASSISTANT_DOCK.badgeSize)}px`,
      '--assistant-badge-offset': `${String(ASSISTANT_DOCK.badgeOffset)}px`,
      '--assistant-panel-width': `${String(ASSISTANT_DOCK.panelWidth)}px`,
      '--assistant-panel-height': `${String(ASSISTANT_DOCK.panelHeight)}px`,
      '--assistant-panel-shift': `${String(shift)}px`,
      '--assistant-top-clear': `${String(ASSISTANT_DOCK.topClear)}px`,
      '--assistant-rise': `${String(ASSISTANT_DOCK.rise)}px`,
      '--assistant-inset': `${String(ASSISTANT_DOCK.inset)}px`,
    } as CSSProperties,
  };
};
