/** A plan the QA asked for from a branch of a repository, measured against its base branch. */
export interface ICodeCommand {
  id: 'code-plan';
  repository: string;
  branch: string;
  base: string;
}
