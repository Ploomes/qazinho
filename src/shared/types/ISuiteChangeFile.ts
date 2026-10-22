import type { SuiteFileStatus } from './SuiteFileStatus';

/** One file a change touched: its path from the repository, what was done to it, the lines it gained and lost, and its unified diff. */
export interface ISuiteChangeFile {
  path: string;
  status: SuiteFileStatus;
  additions: number;
  deletions: number;
  patch: string;
}
