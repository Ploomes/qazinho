import type { IProjectRepository } from '@/modules/Project/types';

/**
 * The repositories a saved project names, each with its owner, name and base branch;
 * anything else, or none, is no repository.
 */
export function repositoriesOf(saved: unknown): IProjectRepository[] {
  if (!Array.isArray(saved)) return [];

  return saved.flatMap((one: unknown) => {
    if (typeof one !== 'object' || one === null) return [];

    const { owner, name, baseBranch } = one as Record<string, unknown>;

    return typeof owner === 'string' &&
      typeof name === 'string' &&
      typeof baseBranch === 'string' &&
      owner !== '' &&
      name !== '' &&
      baseBranch !== ''
      ? [{ owner, name, baseBranch }]
      : [];
  });
}
