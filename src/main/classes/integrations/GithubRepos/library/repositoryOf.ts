import type { IRepository } from '@/shared/types';

/**
 * Um repositório como o gh o imprimiu pelo filtro de repositório, o id dele como texto,
 * ou null quando a linha não é um.
 */
export function repositoryOf(value: unknown): IRepository | null {
  if (typeof value !== 'object' || value === null) return null;

  const line = value as Record<string, unknown>;

  if (
    typeof line.id !== 'number' ||
    typeof line.owner !== 'string' ||
    typeof line.name !== 'string' ||
    typeof line.defaultBranch !== 'string'
  )
    return null;

  return {
    id: String(line.id),
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
