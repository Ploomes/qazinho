/**
 * Como um teste está na tela: rodando agora, como foi na última vez, ou ainda não rodado
 * aqui.
 */
export type SuiteTestState =
  'running' | 'passed' | 'failed' | 'flaky' | 'skipped' | 'pending';
