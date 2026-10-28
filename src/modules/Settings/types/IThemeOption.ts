import type { Theme } from '@/store/AppStore/types';
import type { ParseKeys } from 'i18next';

/**
 * Um cartão de tema desenha as cores próprias do outro tema, que nenhum token do atual
 * guarda.
 */
export interface IThemeOption {
  id: Theme;
  labelKey: ParseKeys;
  swatch: string;
  bar: string;
}
