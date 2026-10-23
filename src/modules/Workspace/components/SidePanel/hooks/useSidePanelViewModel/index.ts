import type { PanelTab } from '@/modules/Workspace/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PANEL } from '@/modules/Workspace/constants';
import { panelWidthOf } from '@/modules/Workspace/library';
import { MOTION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useWorkspaceStore } from '@/store';

export const useSidePanelViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    planCount: opened.plan.length,
    runCount: opened.runs.length,
    bugCount: opened.bugs.filter(({ isDismissed }) => !isDismissed).length,
    isLive: opened.live !== null && !opened.live.isDone,
  }));
  const tab = useWorkspaceStore((state) => state.panelTab);
  const isOpen = useWorkspaceStore((state) => state.isPanelOpen);
  const isWide = useWorkspaceStore((state) => state.isPanelWide);
  const width = useWorkspaceStore((state) => state.panelWidth);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const togglePanel = useWorkspaceStore((state) => state.togglePanel);
  const togglePanelWide = useWorkspaceStore((state) => state.togglePanelWide);
  const setPanelWidth = useWorkspaceStore((state) => state.setPanelWidth);
  const windowWidth = useWindowWidth();
  const [isResizing, setResizing] = useState(false);

  const { inner, outer } = panelWidthOf({ width, windowWidth, isOpen, isWide });
  const rest = panelWidthOf({ width, windowWidth, isOpen, isWide: false }).inner;
  const workspaceId = workspace?.id ?? null;
  const isLive = workspace?.isLive === true;
  const labels: Record<PanelTab, string> = {
    plan: t('WORKSPACE.TAB_PLAN'),
    device: t('WORKSPACE.TAB_DEVICE'),
    runs: t('WORKSPACE.TAB_RUNS'),
    bugs: t('WORKSPACE.TAB_BUGS'),
  };

  useEffect(() => {
    if (isLive) selectTab('device');
  }, [workspaceId, isLive, selectTab]);

  return {
    hasWorkspace: workspace !== null,
    tab,
    isOpen,
    isWide,
    planCount: workspace?.planCount ?? 0,
    runCount: workspace?.runCount ?? 0,
    bugCount: workspace?.bugCount ?? 0,
    isLive,
    railLabel: labels[tab],
    width: inner,
    outerWidth: outer,
    className: isResizing ? 'side-panel side-panel--resizing' : 'side-panel',
    widthTransition: isResizing
      ? { duration: 0 }
      : { duration: MOTION.durationSlow, ease: MOTION.ease },
    style: {
      '--panel-width': `${String(inner)}px`,
      '--panel-rest': `${String(rest)}px`,
      '--panel-handle': `${String(PANEL.handleWidth)}px`,
      '--panel-rail': `${String(PANEL.railWidth)}px`,
      '--panel-header': `${String(PANEL.headerHeight)}px`,
    } as CSSProperties,
    wideLabel: t(isWide ? 'WORKSPACE.PANEL_NARROW' : 'WORKSPACE.PANEL_WIDEN'),
    wideIcon: isWide ? ('narrow' as const) : ('widen' as const),
    hideLabel: t('WORKSPACE.PANEL_HIDE'),
    canResize: !isWide,
    onSelectTab: selectTab,
    onToggle: togglePanel,
    onWide: togglePanelWide,
    onResize: setPanelWidth,
    onResizeStart: () => {
      setResizing(true);
    },
    onResizeEnd: () => {
      setResizing(false);
    },
  };
};
