import type { IMcpRecipe } from './IMcpRecipe';
import type { IMcpServerTarget, McpSignInPhase, McpSignInProgress } from '@/shared/types';

/**
 * Um login em andamento: o servidor, o comando do agente e o nome que o servidor tem lá,
 * como parar, e como relatar.
 */
export interface IMcpSignInRun {
  target: IMcpServerTarget;
  recipe: IMcpRecipe;
  command: string;
  name: string;
  signal: AbortSignal;
  report: (phase: McpSignInPhase) => McpSignInProgress;
}
