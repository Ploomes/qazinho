import type { ViewportId } from './ViewportId';

/**
 * A window size as the device panel offers it: its name, its size in pixels, and whether
 * it is the one kept.
 */
export interface IViewportChoice {
  id: ViewportId;
  label: string;
  size: string;
  isActive: boolean;
}
