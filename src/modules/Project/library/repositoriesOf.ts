import type { IProjectRepository } from '@/modules/Project/types';

/**
 * Os repositórios que um projeto salvo nomeia, cada um com o id do GitHub, o dono, o nome
 * e a branch base; qualquer outra coisa, ou nenhum, não é repositório.
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
