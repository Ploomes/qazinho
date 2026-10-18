/** What a hidden agent shows: its screen row by row, the pages it asked a browser to open, and whether it has closed. */
export interface ITerminalView {
  rows: string[];
  links: string[];
  hasExited: boolean;
}
