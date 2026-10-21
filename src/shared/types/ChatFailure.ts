import type { GithubFailure } from './GithubFailure';
import type { RunFailure } from './RunFailure';

/** Why a chat turn stopped short: what stops a run too, the QA stopping the answer themselves, or GitHub not handing over the code. */
export type ChatFailure =
  | RunFailure
  | { reason: 'stopped' }
  | { reason: 'code'; failure: GithubFailure; said: string };
