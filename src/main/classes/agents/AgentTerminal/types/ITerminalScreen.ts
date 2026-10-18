/** A terminal screen as text: a character per cell, the cursor, the spot ESC 7 saved, and an escape the last output cut short. */
export interface ITerminalScreen {
  cells: string[][];
  row: number;
  col: number;
  saved: { row: number; col: number };
  pending: string;
}
