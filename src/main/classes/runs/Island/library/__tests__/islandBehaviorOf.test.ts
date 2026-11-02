import { describe, expect, it } from 'vitest';
import { islandBehaviorOf } from '@/main/classes/runs/Island/library';

describe('islandBehaviorOf', () => {
  it('is a panel on a Mac, which takes the keyboard without activating the app', () => {
    expect(islandBehaviorOf('darwin')).toEqual({
      options: { focusable: false, type: 'panel' },
      togglesFocus: true,
      joinsSpaces: true,
    });
  });

  it('toggles its focus on Windows, and has no spaces to join', () => {
    expect(islandBehaviorOf('win32')).toEqual({
      options: { focusable: false },
      togglesFocus: true,
      joinsSpaces: false,
    });
  });

  /** O `setFocusable` não existe no Linux: uma janela que nasce sem foco nunca o recebe. */
  it('is born focusable on Linux, where the focus cannot be turned on later', () => {
    expect(islandBehaviorOf('linux')).toEqual({
      options: { focusable: true },
      togglesFocus: false,
      joinsSpaces: true,
    });
  });
});
