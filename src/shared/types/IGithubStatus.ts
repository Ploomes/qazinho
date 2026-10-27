import type { GithubFailure } from './GithubFailure';
import type { IToolStatus } from './IToolStatus';

/**
 * GitHub as this machine reaches it: the GitHub CLI, whom it is signed in as, the access
 * it lacks, and what is wrong, if anything.
 */
export interface IGithubStatus {
  cli: IToolStatus;
  account: string | null;
  missingScopes: string[];
  failure: GithubFailure | null;
}
