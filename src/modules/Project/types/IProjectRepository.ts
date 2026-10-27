/**
 * A GitHub repository a project is made of, with its GitHub id once read, and the branch
 * its changes are measured against.
 */
export interface IProjectRepository {
  id: string | null;
  owner: string;
  name: string;
  baseBranch: string;
}
