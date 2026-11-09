import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PANEL } from '@/modules/Workspace/constants';
import { useChatOnly } from '@/modules/Workspace/hooks/useChatOnly';
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
    name: opened.name,
    questionKey:
      opened.live !== null && !opened.live.isDone && opened.live.question !== undefined
        ? `${opened.id}/${opened.live.id}/${opened.live.question.id}`
        : null,
  }));
  const isChatOnly = useChatOnly();
  const isPanelOpen = useWorkspaceStore((state) => state.isPanelOpen);
  const isOpen = isPanelOpen || isChatOnly;
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const width = useWorkspaceStore((state) => state.panelWidth);
  const togglePanel = useWorkspaceStore((state) => state.togglePanel);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const setPanelWidth = useWorkspaceStore((state) => state.setPanelWidth);
  const collapseCombo = useSettingsStore(
    (state) => state.keybinds.find((keybind) => keybind.id === 'chat')?.combo ?? '',
  );
  const windowWidth = useWindowWidth();
  const [isResizing, setResizing] = useState(false);
  const questionKey = workspace?.questionKey ?? null;

  useEffect(() => {
    if (questionKey !== null) selectTab('chat');
  }, [questionKey, selectTab]);

  const sidebarWidth = useSidebarWidth();
  const { inner, outer } = panelWidthOf({
    width,
    windowWidth,
    isOpen,
    sidebarWidth,
    isAlone: isChatOnly,
  });

  return {
    hasWorkspace: workspace !== null,
    isOpen,
    isChatOnly,
    name: workspace?.name ?? '',
    onRename: (name: string) => {
      if (workspace !== null) renameWorkspace({ workspaceId: workspace.id, name });
    },
    title: t('AGENT.TITLE'),
    railLabel: t('AGENT.TITLE'),
    width: inner,
    outerWidth: outer,
    className: [
      'agent-panel',
      ...(isResizing ? ['agent-panel--resizing'] : []),
      ...(isChatOnly ? ['agent-panel--alone'] : []),
    ].join(' '),
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
