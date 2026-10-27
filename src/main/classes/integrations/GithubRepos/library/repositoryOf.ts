import type { IRepository } from '@/shared/types';

/**
 * A repository as gh printed it through the repository filter, or null when the line is
 * not one.
 */
export function repositoryOf(value: unknown): IRepository | null {
  if (typeof value !== 'object' || value === null) return null;

  const line = value as Record<string, unknown>;

  if (
    typeof line.owner !== 'string' ||
    typeof line.name !== 'string' ||
    typeof line.defaultBranch !== 'string'
  )
    return null;

  return {
    owner: line.owner,
    name: line.name,
    isPrivate: line.isPrivate === true,
    defaultBranch: line.defaultBranch,
    pushedAt: typeof line.pushedAt === 'string' ? line.pushedAt : null,
    description:
      typeof line.description === 'string' && line.description !== ''
        ? line.description
        : null,
  };
}
