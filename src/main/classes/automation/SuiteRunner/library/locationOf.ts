const PLACE = /^(.*?)(:\d+)?$/;
const SPECIAL = /[.*+?^${}()|[\]\\]/g;

/** A file, folder or file:line the page asked for, as Playwright takes it: the path a regular expression that matches only itself, and the line kept. */
export function locationOf(filter: string): string {
  const match = PLACE.exec(filter);
  const path = match?.[1] ?? filter;
  const line = match?.[2] ?? '';

  return `${path.replace(SPECIAL, '\\$&')}${line}`;
}
