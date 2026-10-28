import { relative, resolve } from 'node:path';

/**
 * A página pode pedir um arquivo pelo nome, então um nome que sobe para fora da pasta é
 * recusado.
 */
export function isInside(props: { root: string; file: string }): boolean {
  const step = relative(resolve(props.root), resolve(props.file));

  return step.length > 0 && !step.startsWith('..') && !/^([a-zA-Z]:)?[/\\]/.test(step);
}
