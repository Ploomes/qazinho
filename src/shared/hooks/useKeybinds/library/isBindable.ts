/**
 * Se uma combinação pode ser um atalho: tem Command ou Option, para digitar normalmente
 * nunca disparar um.
 */
export function isBindable(combo: string): boolean {
  return combo.startsWith('⌘') || combo.startsWith('⌥');
}
