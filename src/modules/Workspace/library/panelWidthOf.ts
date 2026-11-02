import { PANEL } from '@/modules/Workspace/constants';
import { SHELL } from '@/shared/constants';

/** Quão largo fica o painel Agente: deixa o centro caber, ou o toma quando está só. */
export function panelWidthOf(props: {
  width: number;
  windowWidth: number;
  isOpen: boolean;
  sidebarWidth: number;
  isAlone?: boolean;
}): { inner: number; outer: number } {
  const room = props.windowWidth - props.sidebarWidth - PANEL.handleWidth;

  if (props.isAlone === true) return { inner: room, outer: room + PANEL.handleWidth };

  const inner = Math.max(
    PANEL.minWidth,
    Math.min(props.width, room - SHELL.centerMinWidth),
  );

  return {
    inner,
    outer: props.isOpen ? inner + PANEL.handleWidth : PANEL.railWidth,
  };
}
