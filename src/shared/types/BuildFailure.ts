import type { GithubFailure } from './GithubFailure';
import type { RunFailure } from './RunFailure';

/**
 * Why a build made nothing: no agent to build with, no code from GitHub, the agent
 * failing, nothing it made that runs, or the QA stopping it.
 */
export type BuildFailure =
  | { reason: 'agent-missing'; agentId: string }
  | { reason: 'code'; failure: GithubFailure }
  | { reason: 'agent'; failure: RunFailure }
  | { reason: 'no-artifact'; said: string }
  | { reason: 'stopped' };
