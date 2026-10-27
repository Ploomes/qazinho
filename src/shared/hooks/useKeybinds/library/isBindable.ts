/**
 * Whether a combo can be a shortcut: it holds Command or Option, so plain typing never
 * sets one off.
 */
export function isBindable(combo: string): boolean {
  return combo.startsWith('⌘') || combo.startsWith('⌥');
}
