import type { ChatCommandId } from './ChatCommandId';
import type { IProjectRepository } from '@/modules/Project/types';
import type { IConfluencePageRef, IDesignLink, IJiraIssueRef } from '@/shared/types';

/**
 * Um comando que o QA está montando no composer: qual, e o repositório e a branch, a
 * história do Jira, a página do Confluence, ou o design do Figma, escolhidos até agora.
 */
export interface ICommandDraft {
  id: ChatCommandId;
  repository: IProjectRepository | null;
  branch: string | null;
  issue: IJiraIssueRef | null;
  page: IConfluencePageRef | null;
  design: IDesignLink | null;
}
