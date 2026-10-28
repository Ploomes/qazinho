import type { AgentSignInPhase } from './AgentSignInPhase';
import type { AgentSignInStep } from './AgentSignInStep';

/**
 * O login de um agente como a main o relata a cada mudança: qual agente, os passos, se
 * ele pede um código, e em que pé está.
 */
export type AgentSignInProgress = {
  agentId: string;
  steps: AgentSignInStep[];
  takesCode: boolean;
} & AgentSignInPhase;
