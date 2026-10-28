import type { GithubFailure } from './GithubFailure';
import type { RunFailure } from './RunFailure';

/**
 * Por que um build não fez nada: nenhum agente para construir, nenhum código do GitHub, o
 * agente falhando, nada feito que rode, ou o QA parando.
 */
export type BuildFailure =
  | { reason: 'agent-missing'; agentId: string }
  | { reason: 'code'; failure: GithubFailure }
  | { reason: 'agent'; failure: RunFailure }
  | { reason: 'no-artifact'; said: string }
  | { reason: 'stopped' };
