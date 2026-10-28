import type { GithubSignInPhase } from './GithubSignInPhase';
import type { GithubSignInStep } from './GithubSignInStep';

/**
 * O login da GitHub CLI, como a main o relata a cada mudança: os passos, e em que pé
 * está.
 */
export type GithubSignInProgress = { steps: GithubSignInStep[] } & GithubSignInPhase;
