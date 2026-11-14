import type { IProjectRepository } from './IProjectRepository';
import type { IReadyColumn } from './IReadyColumn';
import type { ITarget } from './ITarget';
import type { IMemory, IssueTarget, TemplateKind } from '@/shared/types';

/**
 * Um ambiente do app sob teste: os alvos, os repositórios, onde o último bug foi
 * registrado, a coluna de pronto, e se o nome ainda espera o do app.
 */
export interface IProject {
  id: string;
  name: string;
  targets: ITarget[];
  repositories: IProjectRepository[];
  issueTarget?: IssueTarget;
  memories?: IMemory[];
  readyColumn?: IReadyColumn;
  readyStatuses?: string[];
  templates?: Partial<Record<TemplateKind, string>>;
  isNamePending?: boolean;
}
