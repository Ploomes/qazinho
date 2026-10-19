import type { IKeybind } from '@/modules/Settings/types';

/** Gives an action a new combo; the action that had it takes the old one, so no combo fires two actions. */
export function rebind(props: {
  keybinds: IKeybind[];
  keybindId: string;
  combo: string;
}): IKeybind[] {
  const { keybinds, keybindId, combo } = props;
  const before = keybinds.find(({ id }) => id === keybindId)?.combo ?? '';

  return keybinds.map((keybind) => {
    if (keybind.id === keybindId) return { ...keybind, combo };

    return keybind.combo === combo ? { ...keybind, combo: before } : keybind;
  });
}
