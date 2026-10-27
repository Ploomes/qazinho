import type { IProjectRepository } from '@/modules/Project/types';

/**
 * The repositories a saved project names, each with its GitHub id, owner, name and base
 * branch; anything else, or none, is no repository.
 */
export function repositoriesOf(saved: unknown): IProjectRepository[] {
  if (!Array.isArray(saved)) return [];

  return saved.flatMap((one: unknown) => {
    if (typeof one !== 'object' || one === null) return [];

    const { id, owner, name, baseBranch } = one as Record<string, unknown>;

    return typeof id === 'string' &&
      typeof owner === 'string' &&
      typeof name === 'string' &&
      typeof baseBranch === 'string' &&
      owner !== '' &&
      name !== '' &&
      baseBranch !== '' &&
      id !== ''
      ? [{ id, owner, name, baseBranch }]
      : [];
  });
}
