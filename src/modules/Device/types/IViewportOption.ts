import type { ViewportId } from './ViewportId';
import type { ParseKeys } from 'i18next';

/**
 * Um tamanho de janela que o QA pode escolher para uma run web, e o nome pelo qual é
 * conhecido.
 */
export interface IViewportOption {
  id: ViewportId;
  labelKey: ParseKeys;
  width: number;
  height: number;
}
