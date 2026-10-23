import type { CSSProperties } from 'react';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { panelWidthOf } from '@/modules/Workspace/library';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useAppStore, useAssistantStore, useWorkspaceStore } from '@/store';

export const useAssistantDockViewModel = () => {
  const isOpen = useAssistantStore((state) => state.isOpen);
  const hasDevice = useAppStore(
    (state) => state.screen === 'workspace' && state.projects.length > 0,
  );
  const isDeviceShown = useWorkspaceStore(
    (state) => state.isPanelOpen && state.panelTab === 'device',
  );
  const run = useSelectedWorkspacePart((opened) => ({
    isLive: opened.live !== null && !opened.live.isDone,
  }));
  const isPanelWide = useWorkspaceStore((state) => state.isPanelWide);
  const panelWidth = useWorkspaceStore((state) => state.panelWidth);
  const windowWidth = useWindowWidth();
  const shift =
    hasDevice && isDeviceShown && run?.isLive === true
      ? panelWidthOf({
          width: panelWidth,
          windowWidth,
          isOpen: true,
          isWide: isPanelWide,
        }).outer
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
