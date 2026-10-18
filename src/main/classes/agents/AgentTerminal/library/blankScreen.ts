import type { ITerminalScreen } from '@/main/classes/agents/AgentTerminal/types';

/** An empty screen of `height` rows by `width` columns, with the cursor at the top left. */
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
