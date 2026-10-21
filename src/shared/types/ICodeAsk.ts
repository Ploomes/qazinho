/** A branch of a repository to plan from, and the base branch its changes are measured against. */
export interface ICodeAsk {
  owner: string;
  name: string;
  base: string;
  branch: string;
}
