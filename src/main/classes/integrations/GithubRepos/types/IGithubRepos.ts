import type { IGithubApi } from './IGithubApi';

export interface IGithubRepos {
  github: IGithubApi;
  now?: () => number;
}
