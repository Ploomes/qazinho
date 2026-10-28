const HELD = ['Meta', 'Control', 'Alt', 'Shift'];

const NAMED: Record<string, string> = {
  Enter: '↵',
  Escape: '⎋',
  Backspace: '⌫',
  Tab: '⇥',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ' ': '␣',
};

/**
 * O Control faz as vezes do Command fora do macOS, para um atalho escrito funcionar em
 * toda máquina.
 */
export function comboOf(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): string | null {
  if (HELD.includes(event.key)) return null;

  const held = [
    event.metaKey || event.ctrlKey ? '⌘' : '',
    event.altKey ? '⌥' : '',
    event.shiftKey ? '⇧' : '',
  ].join('');

  return `${held}${NAMED[event.key] ?? event.key.toUpperCase()}`;
}
