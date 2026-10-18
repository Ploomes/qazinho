import type { ITerminalScreen } from '@/main/classes/agents/AgentTerminal/types';
import { describe, expect, it } from 'vitest';
import { blankScreen, paintScreen } from '@/main/classes/agents/AgentTerminal/library';

const ESC = '\x1b';

function paint(output: string, screen = blankScreen({ height: 4, width: 10 })) {
  return paintScreen({ screen, output });
}

function rowsOf(screen: ITerminalScreen) {
  return screen.cells.map((cells) => cells.join('').trimEnd());
}

describe('paintScreen', () => {
  it('prints where the cursor is and wraps at the right edge', () => {
    expect(rowsOf(paint('hello world!'))).toEqual(['hello worl', 'd!', '', '']);
  });

  it('goes back to the start of the line on a carriage return, and down on a line feed', () => {
    expect(rowsOf(paint('abc\rX\nY'))).toEqual(['Xbc', ' Y', '', '']);
  });

  it('moves to a row and column, and by a number of cells', () => {
    const screen = paint(`${ESC}[3;5Ha${ESC}[1Ab${ESC}[2Dc${ESC}[1;1Hd${ESC}[2Ge`);

    expect(rowsOf(screen)).toEqual(['de', '    cb', '    a', '']);
  });

  /**
   * Claude Code redraws only the cells that change: moving the selection down writes a space over
   * the old ❯ and a ❯ three rows below, with cursor moves in between. These are its exact bytes.
   */
  it("keeps up with Claude Code's partial redraws", () => {
    const menu = [
      `${ESC}[28;1H   ❯ ⚠ figma                       needs authentication`,
      `${ESC}[30;1H     claude.ai`,
      `${ESC}[31;1H     ✔ claude.ai Claude Docs       8 tools`,
    ].join('');
    const down = `${ESC}(B\x0f${ESC}[?2004h${ESC}[H\r${ESC}[3C${ESC}[27B ${ESC}[8Gfigma\r${ESC}[3C${ESC}[3B${ESC}[38;5;153m❯${ESC}[8Gclaude.ai Claude Docs${ESC}[39m${ESC}[40;1H${ESC}[31;4H`;
    const before = paint(menu, blankScreen({ height: 40, width: 80 }));
    const rows = rowsOf(paint(down, before));

    expect(rows[27]).toBe('     ⚠ figma                       needs authentication');
    expect(rows[30]).toBe('   ❯ ✔ claude.ai Claude Docs       8 tools');
  });

  it('erases to the end of the line, and from the cursor to the end of the screen', () => {
    const full = paint('aaaaaaaaaabbbbbbbbbbcccccccccc');

    expect(rowsOf(paint(`${ESC}[1;4H${ESC}[K`, full))).toEqual([
      'aaa',
      'bbbbbbbbbb',
      'cccccccccc',
      '',
    ]);
    expect(rowsOf(paint(`${ESC}[2;3H${ESC}[J`, full))).toEqual([
      'aaaaaaaaaa',
      'bb',
      '',
      '',
    ]);
    expect(rowsOf(paint(`${ESC}[2J`, full))).toEqual(['', '', '', '']);
  });

  it('drops colours, window titles and links, and draws only the text', () => {
    const output = `${ESC}[1;38;5;153mhi${ESC}[0m${ESC}]0;✳ Claude Code\x07${ESC}]8;;https://x.test\x07link${ESC}]8;;${ESC}\\`;

    expect(rowsOf(paint(output))[0]).toBe('hilink');
  });

  it('keeps an escape cut between two outputs, and finishes it with the next one', () => {
    const half = paint(`ab${ESC}[2`);

    expect(half.pending).toBe(`${ESC}[2`);
    expect(rowsOf(paint('Gc', half))[0]).toBe('ac');
  });

  it('scrolls the screen up when a line feed passes the last row', () => {
    expect(rowsOf(paint('1\n\r2\n\r3\n\r4\n\r5'))).toEqual(['2', '3', '4', '5']);
  });

  it('puts the cursor back where ESC 7 saved it', () => {
    expect(rowsOf(paint(`${ESC}7${ESC}[3;3Hx${ESC}8y`))).toEqual(['y', '', '  x', '']);
  });

  it('does NOT give a combining mark a cell of its own', () => {
    expect(rowsOf(paint('éx'))[0]).toBe('ex');
  });
});
