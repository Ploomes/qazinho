import type { IProjectRepository } from './IProjectRepository';
import type { ITarget } from './ITarget';
import type { IssueTarget } from '@/shared/types';

/**
 * One environment of the app under test, with every target that reaches it, the
 * repositories it is made of, and where its last bug was filed.
 */
export interface IProject {
  id: string;
  name: string;
  targets: ITarget[];
  repositories: IProjectRepository[];
  issueTarget?: IssueTarget;
}
