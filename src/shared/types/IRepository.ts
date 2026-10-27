import type { IRepositoryRef } from './IRepositoryRef';

/**
 * A GitHub repository the QA can read: whether it is private, the branch it calls its
 * own, and when it last moved.
 */
export interface IRepository extends IRepositoryRef {
  isPrivate: boolean;
  defaultBranch: string;
  pushedAt: string | null;
  description: string | null;
}
