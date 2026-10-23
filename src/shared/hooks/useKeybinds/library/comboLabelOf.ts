const OFF_MAC: Record<string, string> = { '⌘': 'Ctrl+', '⌥': 'Alt+', '⇧': 'Shift+' };

/** A shortcut as this machine's keyboard names it: ⌘ and ⌥ on a Mac, Ctrl and Alt everywhere else. */
export function comboLabelOf(props: { combo: string; isMac: boolean }): string {
  return props.isMac
    ? props.combo
    : [...props.combo].map((key) => OFF_MAC[key] ?? key).join('');
}
