import type { AgentSignInFailure } from './AgentSignInFailure';
import type { AgentSignInStep } from './AgentSignInStep';

/**
 * Em que pé está o login de um agente: num passo, com quando o terminal dele abre;
 * logado, parado no meio, ou cancelado.
 */
export type AgentSignInPhase =
  | { phase: 'working'; at: AgentSignInStep; opensAt: number | null }
  | { phase: 'connected' }
  | { phase: 'failed'; at: AgentSignInStep; failure: AgentSignInFailure; said: string }
  | { phase: 'cancelled' };
