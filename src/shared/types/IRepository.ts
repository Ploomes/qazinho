import type { IRepositoryRef } from './IRepositoryRef';

/**
 * Um repositório do GitHub que o QA pode ler: o id, se é privado, a branch que chama de
 * sua, e quando se mexeu por último.
 */
export interface IRepository extends IRepositoryRef {
  id: string;
  isPrivate: boolean;
  defaultBranch: string;
  pushedAt: string | null;
  description: string | null;
}
