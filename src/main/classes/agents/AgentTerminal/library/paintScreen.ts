import type { ITerminalScreen } from '@/main/classes/agents/AgentTerminal/types';
import { AGENT_TERMINAL } from '@/main/classes/agents/AgentTerminal/constants';

const ESC = '\x1b';
const BEL = '\x07';
const MARK = /^\p{M}$/u;
const STRING_OPENERS = new Set([']', 'P', '_', '^', 'X']);
const CHARSET_OPENERS = new Set(['(', ')', '*', '+', '-', '.', '/']);
const ALTERNATE_SCREEN = /^\?(?:1049|1047|47)$/;

const isZeroWidth = (char: string) => {
  const point = char.codePointAt(0) ?? 0;

  return (
    MARK.test(char) ||
    (point >= 0x200b && point <= 0x200f) ||
    point === 0x2060 ||
    (point >= 0xfe00 && point <= 0xfe0f)
  );
};

/** The screen once a terminal draws `output` on it: text, cursor moves, erases and scrolls. Colours, titles and modes are dropped. */
export function paintScreen(props: {
  screen: ITerminalScreen;
  output: string;
}): ITerminalScreen {
  const cells = props.screen.cells.map((line) => [...line]);
  const height = cells.length;
  const width = cells[0]?.length ?? 0;
  const text = Array.from(props.screen.pending + props.output);
  let { row, col } = props.screen;
  let saved = props.screen.saved;
  let at = 0;

  const blankLine = () => Array.from({ length: width }, () => ' ');
  const clamp = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));
  const clear = (from: number, to: number) => {
    for (let cell = from; cell < to; cell += 1) {
      const line = cells[Math.floor(cell / width)];

      if (line) line[cell % width] = ' ';
    }
  };
  const lineFeed = () => {
    if (row < height - 1) {
      row += 1;

      return;
    }

    cells.shift();
    cells.push(blankLine());
  };
  const csi = (params: string, final: string) => {
    if (/^[<=>?]/.test(params)) {
      if (ALTERNATE_SCREEN.test(params) && (final === 'h' || final === 'l')) {
        clear(0, height * width);
        row = 0;
        col = 0;
      }

      return;
    }

    const numbers = params.split(';').map((part) => Number.parseInt(part, 10) || 0);
    const first = numbers[0] ?? 0;
    const count = Math.max(1, first);
    const here = Math.min(col, width - 1);
    const line = cells[row];

    switch (final) {
      case 'A':
        row = clamp(row - count, height);
        col = here;
        break;
      case 'B':
      case 'e':
        row = clamp(row + count, height);
        col = here;
        break;
      case 'C':
      case 'a':
        col = clamp(here + count, width);
        break;
      case 'D':
        col = clamp(here - count, width);
        break;
      case 'E':
        row = clamp(row + count, height);
        col = 0;
        break;
      case 'F':
        row = clamp(row - count, height);
        col = 0;
        break;
      case 'G':
      case '`':
        col = clamp(count - 1, width);
        break;
      case 'd':
        row = clamp(count - 1, height);
        break;
      case 'H':
      case 'f':
        row = clamp(count - 1, height);
        col = clamp(Math.max(1, numbers[1] ?? 0) - 1, width);
        break;
      case 'J':
        if (first === 0) clear(row * width + here, height * width);
        else if (first === 1) clear(0, row * width + here + 1);
        else clear(0, height * width);
        break;
      case 'K':
        if (first === 0) clear(row * width + here, (row + 1) * width);
        else if (first === 1) clear(row * width, row * width + here + 1);
        else clear(row * width, (row + 1) * width);
        break;
      case 'X':
        clear(row * width + here, row * width + Math.min(width, here + count));
        break;
      case 'P':
        line?.splice(here, count);
        while (line && line.length < width) line.push(' ');
        break;
      case '@':
        line?.splice(here, 0, ...Array.from({ length: count }, () => ' '));
        if (line) line.length = width;
        break;
      case 'L':
        cells.splice(row, 0, ...Array.from({ length: count }, blankLine));
        cells.length = height;
        break;
      case 'M':
        cells.splice(row, count);
        while (cells.length < height) cells.push(blankLine());
        break;
      case 'S':
        cells.splice(0, count);
        while (cells.length < height) cells.push(blankLine());
        break;
      case 'T':
        cells.unshift(...Array.from({ length: count }, blankLine));
        cells.length = height;
        break;
      case 'r':
        row = 0;
        col = 0;
        break;
      case 's':
        saved = { row, col };
        break;
      case 'u':
        ({ row, col } = saved);
        break;
      default:
        break;
    }
  };

  while (at < text.length) {
    const char = text[at] ?? '';

    if (char !== ESC) {
      at += 1;

      if (isZeroWidth(char)) continue;

      if (char === '\r') col = 0;
      else if (char === '\n' || char === '\v' || char === '\f') lineFeed();
      else if (char === '\b') col = Math.max(0, Math.min(col, width - 1) - 1);
      else if (char === '\t') col = clamp((Math.floor(col / 8) + 1) * 8, width);
      else if (char >= ' ' && char !== '\x7f') {
        if (col >= width) {
          col = 0;
          lineFeed();
        }

        const line = cells[row];

        if (line) line[col] = char;
        col += 1;
      }

      continue;
    }

    const next = text[at + 1];

    if (next === undefined) break;

    if (next === '[') {
      let end = at + 2;

      while (/^[0-?]$/.test(text[end] ?? '')) end += 1;
      while (/^[ -/]$/.test(text[end] ?? '')) end += 1;

      const final = text[end];

      if (final === undefined) break;

      csi(
        text
          .slice(at + 2, end)
          .join('')
          .replace(/[ -/]+$/, ''),
        final,
      );
      at = end + 1;
      continue;
    }

    if (STRING_OPENERS.has(next)) {
      let end = at + 2;
      let close = -1;

      while (end < text.length && close === -1) {
        if (text[end] === BEL) close = end + 1;
        else if (text[end] === ESC && text[end + 1] === '\\') close = end + 2;
        end += 1;
      }

      if (close === -1) break;

      at = close;
      continue;
    }

    if (CHARSET_OPENERS.has(next)) {
      if (text[at + 2] === undefined) break;

      at += 3;
      continue;
    }

    if (next === '7') saved = { row, col };
    else if (next === '8') ({ row, col } = saved);
    else if (next === 'c') {
      clear(0, height * width);
      row = 0;
      col = 0;
    } else if (next === 'D') lineFeed();
    else if (next === 'E') {
      col = 0;
      lineFeed();
    } else if (next === 'M') {
      if (row > 0) row -= 1;
      else {
        cells.pop();
        cells.unshift(blankLine());
      }
    }

    at += 2;
  }

  const rest = text.slice(at).join('');

  return {
    cells,
    row,
    col,
    saved,
    pending: rest.length > AGENT_TERMINAL.maxPendingChars ? '' : rest,
  };
}
