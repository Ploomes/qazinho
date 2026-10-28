/**
 * O que um agente escondido mostra: a tela dele linha a linha, as páginas que pediu a um
 * navegador para abrir, e se ele fechou.
 */
export interface ITerminalView {
  rows: string[];
  links: string[];
  hasExited: boolean;
}
