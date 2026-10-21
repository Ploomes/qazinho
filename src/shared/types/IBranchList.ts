import type { GithubFailure } from './GithubFailure';
import type { IBranch } from './IBranch';

/** A repository's branches, or why GitHub would not list them. */
export type IBranchList =
  { isListed: true; branches: IBranch[] } | { isListed: false; failure: GithubFailure };
