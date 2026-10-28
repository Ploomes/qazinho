import { isAbsolute, relative, resolve } from 'node:path';

/** Se um caminho, feito inteiro contra uma pasta, fica dentro dessa pasta. */
export function isInside(props: { dir: string; path: string }): boolean {
  const way = relative(resolve(props.dir), resolve(props.dir, props.path));

  return way !== '' && !way.startsWith('..') && !isAbsolute(way);
}
