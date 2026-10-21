import type { GithubSignInPhase } from './GithubSignInPhase';
import type { GithubSignInStep } from './GithubSignInStep';

/** Signing the GitHub CLI in, as main reports it each time it moves: its steps, and where it stands. */
export type GithubSignInProgress = { steps: GithubSignInStep[] } & GithubSignInPhase;
