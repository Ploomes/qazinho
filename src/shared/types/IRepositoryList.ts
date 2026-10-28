import type { GithubFailure } from './GithubFailure';
import type { IRepository } from './IRepository';

/** Os repositórios que o QA pode ler, ou por que o GitHub não os listou. */
export type IRepositoryList =
  | { isListed: true; repositories: IRepository[] }
  | { isListed: false; failure: GithubFailure };
