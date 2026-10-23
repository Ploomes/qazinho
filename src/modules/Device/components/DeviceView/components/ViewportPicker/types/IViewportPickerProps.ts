import type { IViewportChoice, ViewportId } from '@/modules/Device/types';

/** The window sizes a web run can take, the one kept marked, and what picking one does. */
export interface IViewportPickerProps {
  viewports: IViewportChoice[];
  note: string;
  layoutId: string;
  onSelect: (viewportId: ViewportId) => void;
}
