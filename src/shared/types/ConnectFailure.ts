import type { GithubFailure } from './GithubFailure';

/** Por que um tracker não foi conectado, para a página dizer no idioma do QA. */
export type ConnectFailure =
  | { reason: 'unauthorized' }
  | { reason: 'unreachable' }
  | { reason: 'unexpected'; status: number }
  | { reason: 'bad-site' }
  | { reason: 'no-keychain' }
  | { reason: 'no-bridge' }
  | { reason: 'github'; failure: GithubFailure }
  | { reason: 'scopes'; scopes: string[] };
