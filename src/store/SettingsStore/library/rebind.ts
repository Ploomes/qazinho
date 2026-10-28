import type { IKeybind } from '@/modules/Settings/types';

/**
 * Dá a uma ação uma combinação nova; a ação que a tinha fica com a antiga, para nenhuma
 * combinação disparar duas ações.
 */
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
