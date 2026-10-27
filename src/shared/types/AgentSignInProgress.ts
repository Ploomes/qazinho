import type { AgentSignInPhase } from './AgentSignInPhase';
import type { AgentSignInStep } from './AgentSignInStep';

/**
 * An agent's sign-in as main reports it each time it moves: which agent, its steps,
 * whether it takes a code, and where it stands.
 */
export type AgentSignInProgress = {
  agentId: string;
  steps: AgentSignInStep[];
  takesCode: boolean;
} & AgentSignInPhase;
