import type { GithubSignInFailure } from './GithubSignInFailure';
import type { GithubSignInStep } from './GithubSignInStep';

/** Where signing the GitHub CLI in stands: on a step, with the code to type at GitHub; signed in, stopped short, or cancelled. */
export type GithubSignInPhase =
  | { phase: 'working'; at: GithubSignInStep; code: string | null; url: string | null }
  | { phase: 'connected'; account: string }
  | { phase: 'failed'; at: GithubSignInStep; failure: GithubSignInFailure; said: string }
  | { phase: 'cancelled' };
