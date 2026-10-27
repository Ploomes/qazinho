/**
 * Why signing in to QAzinho Pro stopped short: no answer, a no in the browser, an expired
 * code, no keychain for the token, or an answer QAzinho did not expect.
 */
export type ProSignInFailure =
  'unreachable' | 'denied' | 'expired' | 'no-keychain' | 'unexpected';
