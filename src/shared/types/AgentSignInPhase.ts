import type { AgentSignInFailure } from './AgentSignInFailure';
import type { AgentSignInStep } from './AgentSignInStep';

/**
 * Em que pé está o login de um agente: num passo, com a página dele e quando ela abre;
 * logado, parado no meio, ou cancelado.
 */
export type AgentSignInPhase =
  | { phase: 'working'; at: AgentSignInStep; url: string | null; opensAt: number | null }
  | { phase: 'connected' }
  | { phase: 'failed'; at: AgentSignInStep; failure: AgentSignInFailure; said: string }
  | { phase: 'cancelled' };
