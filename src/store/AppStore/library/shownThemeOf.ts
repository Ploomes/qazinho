import type { ShownTheme, Theme } from '@/store/AppStore/types';

/** O tema que a tela desenha: o escolhido, ou o do computador quando é o do sistema. */
export function shownThemeOf(props: {
  theme: Theme;
  systemTheme: ShownTheme;
}): ShownTheme {
  return props.theme === 'system' ? props.systemTheme : props.theme;
}
