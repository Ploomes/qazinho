/**
 * Why a change to the variables was not kept: no keychain to seal it with or no bridge to
 * main, or the name it broke on.
 */
export type VariableFailure =
  | { reason: 'no-keychain' | 'no-bridge' }
  | { reason: 'bad-name' | 'taken' | 'no-value' | 'missing'; name: string };
