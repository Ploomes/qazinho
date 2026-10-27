import type { IViewportOption } from '@/modules/Device/types';
import { VIEWPORTS } from '@/modules/Device/constants/VIEWPORTS';

/**
 * The window size a workspace keeps, falling back to the desktop one for a name it does
 * not know.
 */
export function viewportOf(viewportId: string | undefined): IViewportOption {
  return (
    VIEWPORTS.find(({ id }) => id === viewportId) ?? (VIEWPORTS[0] as IViewportOption)
  );
}
