/** The code a plan was made from: the repository, the branch at its commit, and the base it was measured against. */
export interface ICodeSource {
  repository: string;
  branch: string;
  base: string;
  commit: string;
}
