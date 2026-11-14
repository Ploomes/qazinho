import { describe, expect, it } from 'vitest';
import { KEYBINDS } from '@/modules/Settings/constants';
import { rebind } from '@/store/SettingsStore/library';

const comboOf = (keybinds: { id: string; combo: string }[], id: string) =>
  keybinds.find((keybind) => keybind.id === id)?.combo;

describe('rebind', () => {
  it('gives the action the combo the QA pressed', () => {
    expect(
      comboOf(rebind({ keybinds: KEYBINDS, keybindId: 'run', combo: '⌘Y' }), 'run'),
    ).toBe('⌘Y');
  });

  it('swaps with the action that had the combo, so neither goes dead', () => {
    const swapped = rebind({ keybinds: KEYBINDS, keybindId: 'run', combo: '⌘1' });

    expect(comboOf(swapped, 'run')).toBe('⌘1');
    expect(comboOf(swapped, 'chat')).toBe('⌘↵');
  });

  it('does NOT touch the other actions', () => {
    const changed = rebind({ keybinds: KEYBINDS, keybindId: 'run', combo: '⌘Y' }).filter(
      (keybind, index) => keybind.combo !== KEYBINDS[index]?.combo,
    );

    expect(changed.map(({ id }) => id)).toEqual(['run']);
  });
});
