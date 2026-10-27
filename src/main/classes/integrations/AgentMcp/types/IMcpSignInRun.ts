import type { IMcpRecipe } from './IMcpRecipe';
import type { IMcpServerTarget, McpSignInPhase, McpSignInProgress } from '@/shared/types';

/**
 * A sign-in under way: the server, the agent's command and the name the server has there,
 * how to stop, and how to report.
 */
export interface IMcpSignInRun {
  target: IMcpServerTarget;
  recipe: IMcpRecipe;
  command: string;
  name: string;
  signal: AbortSignal;
  report: (phase: McpSignInPhase) => McpSignInProgress;
}
