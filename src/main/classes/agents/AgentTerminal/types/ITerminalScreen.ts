/**
 * Uma tela de terminal como texto: um caractere por célula, o cursor, o ponto que o ESC 7
 * salvou, e um escape que a última saída cortou.
 */
export interface ITerminalScreen {
  cells: string[][];
  row: number;
  col: number;
  saved: { row: number; col: number };
  pending: string;
}
