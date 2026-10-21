import type { ChatCommandId } from './ChatCommandId';

/** A command the QA sent: a plan from a branch of a repository, measured against its base branch. */
export interface IUserCommand {
  id: ChatCommandId;
  repository: string;
  branch: string;
  base: string;
}
