import { PANEL } from '@/modules/Workspace/constants';
import { SHELL } from '@/shared/constants';

/** Quão largo fica o painel ao lado do chat, deixando espaço para o chat caber. */
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
