import type { GithubFailure } from './GithubFailure';
import type { IBranch } from './IBranch';

/** As branches de um repositório, ou por que o GitHub não as listou. */
export type IBranchList =
  { isListed: true; branches: IBranch[] } | { isListed: false; failure: GithubFailure };
