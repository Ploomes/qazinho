import { PANEL } from '@/modules/Workspace/constants';
import { SHELL } from '@/shared/constants';

/** How wide the panel beside the chat stands: the width the QA gave it, narrowed so the chat still fits beside the sidebar; all the room while widened; only the rail while shut. */
export function panelWidthOf(props: {
  width: number;
  windowWidth: number;
  isOpen: boolean;
  isWide: boolean;
  sidebarWidth: number;
}): { inner: number; outer: number } {
  const room = props.windowWidth - props.sidebarWidth - PANEL.handleWidth;
  const inner = props.isWide
    ? Math.max(PANEL.minWidth, room)
    : Math.max(PANEL.minWidth, Math.min(props.width, room - SHELL.centerMinWidth));

  return {
    inner,
    outer: props.isOpen ? inner + PANEL.handleWidth : PANEL.railWidth,
  };
}
