import type { McpSignInFailure } from './McpSignInFailure';
import type { McpSignInStep } from './McpSignInStep';

/**
 * Where a sign-in stands: on a step, with the sign-in page and when it opens; connected,
 * stopped short, or cancelled.
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
