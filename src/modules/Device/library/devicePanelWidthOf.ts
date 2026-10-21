import { DEVICE } from '@/modules/Device/constants';
import { SHELL } from '@/shared/constants';

/** How wide the device panel stands: the width the QA gave it, narrowed so the center column still fits, with its handle; only the rail while it is shut. */
export function devicePanelWidthOf(props: {
  width: number;
  windowWidth: number;
  isOpen: boolean;
}): { inner: number; outer: number } {
  const inner = Math.max(
    DEVICE.minWidth,
    Math.min(
      props.width,
      props.windowWidth - SHELL.sidebarWidth - SHELL.centerMinWidth - DEVICE.handleWidth,
    ),
  );

  return {
    inner,
    outer: props.isOpen ? inner + DEVICE.handleWidth : DEVICE.railWidth,
  };
}
