import { relative, resolve } from 'node:path';

/** The page may ask for a file by name, so a name that climbs out of the folder is refused. */
export function isInside(props: { root: string; file: string }): boolean {
  const step = relative(resolve(props.root), resolve(props.file));

  return step.length > 0 && !step.startsWith('..') && !/^([a-zA-Z]:)?[/\\]/.test(step);
}
