import type { IMcpServerTarget } from './IMcpServerTarget';
import type { McpSignInPhase } from './McpSignInPhase';
import type { McpSignInStep } from './McpSignInStep';

/**
 * Um login como a main o relata a cada mudança: qual servidor em qual agente, os passos
 * que ele dá, e em que pé está.
 */
export type McpSignInProgress = {
  target: IMcpServerTarget;
  steps: McpSignInStep[];
} & McpSignInPhase;
