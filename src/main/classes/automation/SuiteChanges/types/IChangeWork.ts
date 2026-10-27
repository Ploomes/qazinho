/**
 * Where a change works: the QA's repository, the worktree, the suite's folder and the
 * paths linked in.
 */
export interface IChangeWork {
  repo: string;
  work: string;
  dir: string;
  links: string[];
}
