/**
 * A GitHub repository a project is made of, by its GitHub id, and the branch its changes
 * are measured against.
 */
export interface IProjectRepository {
  id: string;
  owner: string;
  name: string;
  baseBranch: string;
}
