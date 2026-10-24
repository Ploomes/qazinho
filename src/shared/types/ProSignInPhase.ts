import type { ProSignInFailure } from './ProSignInFailure';
import type { ProSignInStep } from './ProSignInStep';

/** Where signing in to QAzinho Pro stands: on a step, with the code to confirm in the browser; signed in, stopped short, or cancelled. */
export type ProSignInPhase =
  | { phase: 'working'; at: ProSignInStep; code: string | null; url: string | null }
  | { phase: 'connected'; account: string }
  | { phase: 'failed'; at: ProSignInStep; failure: ProSignInFailure }
  | { phase: 'cancelled' };
