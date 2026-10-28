import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { PANEL } from '@/modules/Workspace/constants';

/**
 * Até onde o botão do Estagiário passa do trilho do painel para dentro da coluna do
 * workspace, gap incluído; nada quando o painel aberto ocupa o canto.
 */
export function dockRoomOf(props: {
  isWorkspace: boolean;
  isPanelOpen: boolean;
}): number {
  if (!props.isWorkspace || props.isPanelOpen) return 0;

  return (
    ASSISTANT_DOCK.inset +
    ASSISTANT_DOCK.buttonSize +
    ASSISTANT_DOCK.rise -
    PANEL.railWidth
  );
}
