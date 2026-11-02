import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PANEL } from '@/modules/Workspace/constants';
import { panelWidthOf } from '@/modules/Workspace/library';
import { MOTION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useSidebarWidth } from '@/shared/hooks/useSidebarWidth';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useSettingsStore, useWorkspaceStore } from '@/store';

export const useAgentPanelViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    isLive: opened.live !== null && !opened.live.isDone,
  }));
  const isOpen = useWorkspaceStore((state) => state.isPanelOpen);
  const width = useWorkspaceStore((state) => state.panelWidth);
  const togglePanel = useWorkspaceStore((state) => state.togglePanel);
  const setPanelWidth = useWorkspaceStore((state) => state.setPanelWidth);
  const collapseCombo = useSettingsStore(
    (state) => state.keybinds.find((keybind) => keybind.id === 'chat')?.combo ?? '',
  );
  const windowWidth = useWindowWidth();
  const [isResizing, setResizing] = useState(false);

  const sidebarWidth = useSidebarWidth();
  const { inner, outer } = panelWidthOf({
    width,
    windowWidth,
    isOpen,
    sidebarWidth,
  });
  const isLive = workspace?.isLive === true;

  return {
    hasWorkspace: workspace !== null,
    isOpen,
    title: t('AGENT.TITLE'),
    subtitle: isLive ? t('AGENT.LIVE') : '',
    railLabel: t('AGENT.TITLE'),
    width: inner,
    outerWidth: outer,
    className: isResizing ? 'agent-panel agent-panel--resizing' : 'agent-panel',
    widthTransition: isResizing
      ? { duration: 0 }
      : { duration: MOTION.durationSlow, ease: MOTION.ease },
    style: {
      '--panel-width': `${String(inner)}px`,
      '--panel-handle': `${String(PANEL.handleWidth)}px`,
      '--panel-rail': `${String(PANEL.railWidth)}px`,
      '--panel-header': `${String(PANEL.headerHeight)}px`,
    } as CSSProperties,
    hideLabel: t('AGENT.HIDE'),
    showLabel: t('AGENT.SHOW'),
    collapseLabel: t('AGENT.COLLAPSE'),
    collapseCombo,
    onToggle: togglePanel,
    onResize: setPanelWidth,
    onResizeStart: () => {
      setResizing(true);
    },
    onResizeEnd: () => {
      setResizing(false);
    },
  };
};
