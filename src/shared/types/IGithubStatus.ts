import type { GithubFailure } from './GithubFailure';
import type { IToolStatus } from './IToolStatus';

/**
 * O GitHub como esta máquina o alcança: a GitHub CLI, como quem ela está logada, o acesso
 * que falta, e o que está errado, se algo.
 */
export interface IGithubStatus {
  cli: IToolStatus;
  account: string | null;
  missingScopes: string[];
  failure: GithubFailure | null;
}
