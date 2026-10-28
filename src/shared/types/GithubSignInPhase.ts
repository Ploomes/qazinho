import type { GithubSignInFailure } from './GithubSignInFailure';
import type { GithubSignInStep } from './GithubSignInStep';

/**
 * Em que pé está o login da GitHub CLI: num passo, com o código a digitar no GitHub;
 * logado, parado no meio, ou cancelado.
 */
export type GithubSignInPhase =
  | { phase: 'working'; at: GithubSignInStep; code: string | null; url: string | null }
  | { phase: 'connected'; account: string }
  | { phase: 'failed'; at: GithubSignInStep; failure: GithubSignInFailure; said: string }
  | { phase: 'cancelled' };
