import type { ViewportId } from './ViewportId';

/**
 * Um tamanho de janela como o painel do dispositivo o oferece: o nome, o tamanho em
 * pixels, e se é o guardado.
 */
export interface IViewportChoice {
  id: ViewportId;
  label: string;
  size: string;
  isActive: boolean;
}
