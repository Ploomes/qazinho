/**
 * Por que uma mudança nas variáveis não foi guardada: nenhum keychain para lacrá-la ou
 * nenhuma bridge até a main, ou o nome em que quebrou.
 */
export type VariableFailure =
  | { reason: 'no-keychain' | 'no-bridge' }
  | { reason: 'bad-name' | 'taken' | 'no-value' | 'missing'; name: string };
