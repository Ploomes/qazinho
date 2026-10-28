const OFF_MAC: Record<string, string> = { '⌘': 'Ctrl+', '⌥': 'Alt+', '⇧': 'Shift+' };

/**
 * Um atalho como o teclado desta máquina o nomeia: ⌘ e ⌥ num Mac, Ctrl e Alt em todo o
 * resto.
 */
export function comboLabelOf(props: { combo: string; isMac: boolean }): string {
  return props.isMac
    ? props.combo
    : [...props.combo].map((key) => OFF_MAC[key] ?? key).join('');
}
