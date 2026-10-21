import type { ChatCommandId } from './ChatCommandId';
import type { IProjectRepository } from '@/modules/Project/types';

/** A command the QA is putting together in the composer: which, and the repository and branch picked so far. */
export interface ICommandDraft {
  id: ChatCommandId;
  repository: IProjectRepository | null;
  branch: string | null;
}
