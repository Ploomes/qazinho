import type { McpSignInFailure } from './McpSignInFailure';
import type { McpSignInStep } from './McpSignInStep';

/**
 * Em que pé está um login: num passo, com a página de login e quando ela abre; conectado,
 * parado no meio, ou cancelado.
 */
export type McpSignInPhase =
  | { phase: 'working'; at: McpSignInStep; url: string | null; opensAt: number | null }
  | { phase: 'connected' }
  | {
      phase: 'failed';
      at: McpSignInStep;
      failure: McpSignInFailure;
      said: string;
      canUseTerminal: boolean;
    }
  | { phase: 'cancelled' };
