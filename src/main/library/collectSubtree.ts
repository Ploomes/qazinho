import type { IProcessRow } from '@/main/types';

/**
 * Every descendant of a root, so an agent's shell and its children are charged to the
 * agent.
 */
export function collectSubtree(props: {
  rows: IProcessRow[];
  rootPid: number;
}): IProcessRow[] {
  const { rows, rootPid } = props;
  const childrenOf = new Map<number, IProcessRow[]>();

  for (const row of rows) {
    childrenOf.set(row.parentPid, [...(childrenOf.get(row.parentPid) ?? []), row]);
  }

  const collected: IProcessRow[] = [];
  const queue = [rootPid];
  const seen = new Set<number>();

  while (queue.length > 0) {
    const pid = queue.shift();

    if (pid === undefined || seen.has(pid)) continue;

    seen.add(pid);

    for (const child of childrenOf.get(pid) ?? []) {
      collected.push(child);
      queue.push(child.pid);
    }
  }

  return collected;
}
