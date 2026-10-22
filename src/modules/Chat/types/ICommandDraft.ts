import type { ChatCommandId } from './ChatCommandId';
import type { IProjectRepository } from '@/modules/Project/types';
import type { IJiraIssueRef } from '@/shared/types';

/** A command the QA is putting together in the composer: which, and the repository and branch, or the Jira story, picked so far. */
export interface ICommandDraft {
  id: ChatCommandId;
  repository: IProjectRepository | null;
  branch: string | null;
  issue: IJiraIssueRef | null;
}
