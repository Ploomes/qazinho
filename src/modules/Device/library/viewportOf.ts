import type { IViewportOption } from '@/modules/Device/types';
import { VIEWPORTS } from '@/modules/Device/constants/VIEWPORTS';

/**
 * O tamanho de janela que um workspace guarda, caindo no de desktop para um nome que não
 * conhece.
 */
export function viewportOf(viewportId: string | undefined): IViewportOption {
  return (
    VIEWPORTS.find(({ id }) => id === viewportId) ?? (VIEWPORTS[0] as IViewportOption)
  );
}
