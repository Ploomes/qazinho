import type { GithubFailure } from './GithubFailure';

/** Why a tracker was not connected, for the page to say in the QA's language: the credentials refused, the site out of reach or not a site, no keychain to seal them with, or what the GitHub CLI lacks. */
export type ConnectFailure =
  | { reason: 'unauthorized' }
  | { reason: 'unreachable' }
  | { reason: 'unexpected'; status: number }
  | { reason: 'bad-site' }
  | { reason: 'no-keychain' }
  | { reason: 'no-bridge' }
  | { reason: 'github'; failure: GithubFailure }
  | { reason: 'scopes'; scopes: string[] };
