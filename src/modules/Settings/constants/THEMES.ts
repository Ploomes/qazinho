import type { IThemeOption } from '@/modules/Settings/types';

export const THEMES: IThemeOption[] = [
  {
    id: 'system',
    labelKey: 'SETTINGS.THEME_SYSTEM',
    swatch: 'linear-gradient(115deg, #fbfaf6 0 50%, #1b1b1a 50% 100%)',
    bar: '#8c8a83',
  },
  { id: 'light', labelKey: 'SETTINGS.THEME_LIGHT', swatch: '#fbfaf6', bar: '#e2ddcd' },
  { id: 'dark', labelKey: 'SETTINGS.THEME_DARK', swatch: '#1b1b1a', bar: '#31302d' },
];
