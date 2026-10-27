import type { IBranch } from '@/shared/types';

const HEADS = 'refs/heads/';

/**
 * A repository's branches for the QA to pick from: its own first, then the ones that
 * moved or head a pull request, newest first, then the rest by name.
 */
export function branchesOf(props: {
  names: string[];
  defaultBranch: string;
  pushes: unknown[];
  pulls: unknown[];
  repository: string;
}): IBranch[] {
  const moved = pushesOf(props.pushes);
  const heads = pullsOf({ lines: props.pulls, repository: props.repository });
  const names = [...new Set([props.defaultBranch, ...props.names])];
  const branches = names.map((name): IBranch => {
    const pull = heads.get(name);
    const times = [moved.get(name), pull?.updatedAt ?? undefined].filter(
      (time): time is string => time !== undefined,
    );

    return {
      name,
      isDefault: name === props.defaultBranch,
      pullRequest: pull === undefined ? null : { number: pull.number, title: pull.title },
      movedAt: times.length === 0 ? null : times.reduce((a, b) => (a > b ? a : b)),
    };
  });

  return branches.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    if ((a.movedAt === null) !== (b.movedAt === null)) return a.movedAt === null ? 1 : -1;
    if (a.movedAt !== null && b.movedAt !== null && a.movedAt !== b.movedAt)
      return a.movedAt > b.movedAt ? -1 : 1;

    return a.name.localeCompare(b.name);
  });
}

function pushesOf(lines: unknown[]): Map<string, string> {
  const moved = new Map<string, string>();

  for (const value of lines) {
    if (typeof value !== 'object' || value === null) continue;

    const { ref, timestamp } = value as Record<string, unknown>;

    if (typeof ref !== 'string' || typeof timestamp !== 'string') continue;
    if (!ref.startsWith(HEADS)) continue;

    const name = ref.slice(HEADS.length);
    const known = moved.get(name);

    if (known === undefined || known < timestamp) moved.set(name, timestamp);
  }

  return moved;
}

function pullsOf(props: {
  lines: unknown[];
  repository: string;
}): Map<string, { number: number; title: string; updatedAt: string | null }> {
  const heads = new Map<
    string,
    { number: number; title: string; updatedAt: string | null }
  >();

  for (const value of props.lines) {
    if (typeof value !== 'object' || value === null) continue;

    const pull = value as Record<string, unknown>;

    if (
      typeof pull.number !== 'number' ||
      typeof pull.title !== 'string' ||
      typeof pull.head !== 'string' ||
      pull.headRepo !== props.repository ||
      heads.has(pull.head)
    )
      continue;

    heads.set(pull.head, {
      number: pull.number,
      title: pull.title,
      updatedAt: typeof pull.updatedAt === 'string' ? pull.updatedAt : null,
    });
  }

  return heads;
}
