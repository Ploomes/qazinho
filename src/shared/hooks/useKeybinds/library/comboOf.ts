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
 * Control stands in for Command off macOS, so one written shortcut works on every
 * machine.
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
