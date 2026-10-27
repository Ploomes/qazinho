import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { PANEL } from '@/modules/Workspace/constants';

/**
 * How far the Estagiário's button reaches past the panel's rail into the workspace's
 * column, gap included; nothing when the open panel takes the corner.
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
