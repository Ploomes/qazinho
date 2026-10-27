import type { GithubFailure } from './GithubFailure';

/** Why a tracker was not connected, for the page to say in the QA's language. */
export type ConnectFailure =
  | { reason: 'unauthorized' }
  | { reason: 'unreachable' }
  | { reason: 'unexpected'; status: number }
  | { reason: 'bad-site' }
  | { reason: 'no-keychain' }
  | { reason: 'no-bridge' }
  | { reason: 'github'; failure: GithubFailure }
  | { reason: 'scopes'; scopes: string[] };
