/**
 * Como a janela da ilha se comporta num sistema: como nasce, se o foco dela liga e desliga
 * depois de aberta, e se ela vai a todos os espaços.
 */
export interface IIslandBehavior {
  options: { focusable: boolean; type?: 'panel' };
  togglesFocus: boolean;
  joinsSpaces: boolean;
}
