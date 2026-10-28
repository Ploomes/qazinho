/**
 * Em que pé está uma run de uma suíte: andando, todo teste como esperado, alguns
 * falharam, parada pelo QA, ou quebrada antes de os testes dizerem.
 */
export type SuiteRunStatus = 'running' | 'passed' | 'failed' | 'stopped' | 'broke';
