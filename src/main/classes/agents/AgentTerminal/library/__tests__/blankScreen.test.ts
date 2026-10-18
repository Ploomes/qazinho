import { describe, expect, it } from 'vitest';
import { blankScreen } from '@/main/classes/agents/AgentTerminal/library';

describe('blankScreen', () => {
  it('starts empty, with the cursor at the top left', () => {
    const screen = blankScreen({ height: 2, width: 3 });

    expect(screen.cells).toEqual([
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]);
    expect(screen).toMatchObject({
      row: 0,
      col: 0,
      saved: { row: 0, col: 0 },
      pending: '',
    });
  });

  it('gives every row its own cells, so drawing on one leaves the others alone', () => {
    const screen = blankScreen({ height: 2, width: 2 });

    screen.cells[0]?.splice(0, 1, 'x');

    expect(screen.cells[1]).toEqual([' ', ' ']);
  });
});
