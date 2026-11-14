import type { ChatCommandId } from './ChatCommandId';
import type { IProjectRepository } from '@/modules/Project/types';
import type {
  IConfluencePageRef,
  IDesignLink,
  IImportSource,
  IJiraIssueRef,
  ISkill,
} from '@/shared/types';

/**
 * Um comando que o QA está montando no composer: qual, e o que escolheu até agora, do
 * repositório e da branch à pasta de testes ou à skill.
 */
export interface ICommandDraft {
  id: ChatCommandId;
  repository: IProjectRepository | null;
  branch: string | null;
  issue: IJiraIssueRef | null;
  page: IConfluencePageRef | null;
  design: IDesignLink | null;
  folder: IImportSource | null;
  skill: ISkill | null;
}
