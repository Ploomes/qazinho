import type { IMcpServerTarget } from './IMcpServerTarget';
import type { McpSignInPhase } from './McpSignInPhase';
import type { McpSignInStep } from './McpSignInStep';

/** A sign-in as main reports it each time it moves: which server in which agent, the steps it takes, and where it stands. */
export type McpSignInProgress = {
  target: IMcpServerTarget;
  steps: McpSignInStep[];
} & McpSignInPhase;
