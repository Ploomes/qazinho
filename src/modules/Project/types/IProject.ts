import type { IProjectRepository } from './IProjectRepository';
import type { ITarget } from './ITarget';
import type { IMemory, IssueTarget } from '@/shared/types';

/**
 * Um ambiente do app sob teste: os alvos, os repositórios, onde o último bug foi
 * registrado, e os status do Jira em que uma história chegou para teste.
 */
export interface IProject {
  id: string;
  name: string;
  targets: ITarget[];
  repositories: IProjectRepository[];
  issueTarget?: IssueTarget;
  memories?: IMemory[];
  readyStatuses?: string[];
}
