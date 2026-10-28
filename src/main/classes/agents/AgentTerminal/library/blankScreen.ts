import type { ITerminalScreen } from '@/main/classes/agents/AgentTerminal/types';

/**
 * Uma tela vazia de `height` linhas por `width` colunas, com o cursor no canto superior
 * esquerdo.
 */
export function blankScreen(props: { height: number; width: number }): ITerminalScreen {
  return {
    cells: Array.from({ length: props.height }, () =>
      Array.from({ length: props.width }, () => ' '),
    ),
    row: 0,
    col: 0,
    saved: { row: 0, col: 0 },
    pending: '',
  };
}
