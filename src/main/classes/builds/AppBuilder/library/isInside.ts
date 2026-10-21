import { isAbsolute, relative, resolve } from 'node:path';

/** Whether a path, made whole against a folder, stays inside that folder. */
export function isInside(props: { dir: string; path: string }): boolean {
  const way = relative(resolve(props.dir), resolve(props.dir, props.path));

  return way !== '' && !way.startsWith('..') && !isAbsolute(way);
}
