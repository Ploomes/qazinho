import type { ProSignInFailure } from './ProSignInFailure';
import type { ProSignInStep } from './ProSignInStep';

/**
 * Em que pé está entrar no QAzinho Pro: num passo, com o código a confirmar no navegador;
 * logado, parado no meio, ou cancelado.
 */
export type ProSignInPhase =
  | { phase: 'working'; at: ProSignInStep; code: string | null; url: string | null }
  | { phase: 'connected'; account: string }
  | { phase: 'failed'; at: ProSignInStep; failure: ProSignInFailure }
  | { phase: 'cancelled' };
