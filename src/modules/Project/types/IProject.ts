import type { IProjectRepository } from './IProjectRepository';
import type { ITarget } from './ITarget';
import type { IMemory, IssueTarget } from '@/shared/types';

/**
 * Um ambiente do app sob teste, com todo alvo que o alcança, os repositórios de que é
 * feito, e onde o último bug dele foi registrado.
 */
export interface IProject {
  id: string;
  name: string;
  targets: ITarget[];
  repositories: IProjectRepository[];
  issueTarget?: IssueTarget;
  memories?: IMemory[];
}
