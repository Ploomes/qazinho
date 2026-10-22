/** Where a change works, as main keeps it beside the change: the QA's repository, the worktree, the suite's folder in it, and the paths QAzinho linked there, never part of the change. */
export interface IChangeWork {
  repo: string;
  work: string;
  dir: string;
  links: string[];
}
