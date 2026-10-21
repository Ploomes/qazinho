import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { DEVICE } from '@/modules/Device/constants';

/** How far the Estagiário's button reaches past the device rail into the workspace's column, gap included; nothing when the open device panel takes the corner. */
export function dockRoomOf(props: {
  isWorkspace: boolean;
  isDeviceOpen: boolean;
}): number {
  if (!props.isWorkspace || props.isDeviceOpen) return 0;

  return (
    ASSISTANT_DOCK.inset +
    ASSISTANT_DOCK.buttonSize +
    ASSISTANT_DOCK.rise -
    DEVICE.railWidth
  );
}
