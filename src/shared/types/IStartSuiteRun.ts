import type { ISuiteBatch } from './ISuiteBatch';

/**
 * Uma run da suíte de um projeto: o id, os batches por que passa, um projeto do
 * Playwright depois do outro, e quantos testes a página espera que eles alcancem.
 */
export interface IStartSuiteRun {
  projectId: string;
  runId: string;
  batches: ISuiteBatch[];
  expected: number;
}
