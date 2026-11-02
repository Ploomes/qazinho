import type { IViewportChoice, ViewportId } from '@/modules/Device/types';

/**
 * Os tamanhos de janela que uma run web pode ter, o guardado marcado, e o que escolher um
 * faz.
 */
export interface IViewportPickerProps {
  viewports: IViewportChoice[];
  onSelect: (viewportId: ViewportId) => void;
}
