const PLACE = /^(.*?)(:\d+)?$/;
const SPECIAL = /[.*+?^${}()|[\]\\]/g;

/**
 * Um arquivo ou arquivo:linha como o Playwright o toma: uma expressão regular que casa só
 * esse arquivo.
 */
export function locationOf(filter: string): string {
  const match = PLACE.exec(filter);
  const path = match?.[1] ?? filter;
  const line = match?.[2] ?? '';

  return `(^|[\\\\/])${path
    .split(/[\\/]/)
    .map((part) => part.replace(SPECIAL, '\\$&'))
    .join('[\\\\/]')}$${line}`;
}
