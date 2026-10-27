import type { Theme } from '@/store/AppStore/types';
import type { ParseKeys } from 'i18next';

/**
 * A theme card draws the other theme's own colours, which no token of the current one
 * holds.
 */
export interface IThemeOption {
  id: Theme;
  labelKey: ParseKeys;
  swatch: string;
  bar: string;
}
