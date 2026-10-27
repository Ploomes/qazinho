import type { IRepositoryRef } from './IRepositoryRef';

/**
 * A GitHub repository the QA can read: its id, whether it is private, the branch it calls
 * its own, and when it last moved.
 */
export interface IRepository extends IRepositoryRef {
  id: string;
  isPrivate: boolean;
  defaultBranch: string;
  pushedAt: string | null;
  description: string | null;
}
