import type { GithubFailure } from './GithubFailure';
import type { IRepository } from './IRepository';

/** The repositories the QA can read, or why GitHub would not list them. */
export type IRepositoryList =
  | { isListed: true; repositories: IRepository[] }
  | { isListed: false; failure: GithubFailure };
