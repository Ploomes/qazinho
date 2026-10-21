/** A GitHub repository a project is made of, and the branch its changes are measured against. */
export interface IProjectRepository {
  owner: string;
  name: string;
  baseBranch: string;
}
