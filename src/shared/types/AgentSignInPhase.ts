import type { AgentSignInFailure } from './AgentSignInFailure';
import type { AgentSignInStep } from './AgentSignInStep';

/** Where an agent's sign-in stands: on a step with its page once there is one, signed in, stopped short, or cancelled. */
export type AgentSignInPhase =
  | { phase: 'working'; at: AgentSignInStep; url: string | null }
  | { phase: 'connected' }
  | { phase: 'failed'; at: AgentSignInStep; failure: AgentSignInFailure; said: string }
  | { phase: 'cancelled' };
