import type { IProjectRepository } from '@/modules/Project/types';

/**
 * The repositories a saved project names, each with its owner, name and base branch, and
 * its GitHub id when kept; anything else is no repository.
 */
export function repositoriesOf(saved: unknown): IProjectRepository[] {
  if (!Array.isArray(saved)) return [];

  return saved.flatMap((one: unknown) => {
    if (typeof one !== 'object' || one === null) return [];

    const { id, owner, name, baseBranch } = one as Record<string, unknown>;

    return typeof owner === 'string' &&
      typeof name === 'string' &&
      typeof baseBranch === 'string' &&
      owner !== '' &&
      name !== '' &&
      baseBranch !== ''
      ? [{ id: typeof id === 'string' && id !== '' ? id : null, owner, name, baseBranch }]
      : [];
  });
}
