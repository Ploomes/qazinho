import type { ISuitePlanCase } from './ISuitePlanCase';
import type { ISuiteTest } from './ISuiteTest';

/**
 * O que o QA pediu ao agente dele na suíte de um time: consertar um teste quebrado, ou
 * escrever um novo.
 */
export type SuiteChangeAsk =
  | { kind: 'fix'; test: ISuiteTest; runId: string }
  | { kind: 'write'; text: string; folder: string; source: ISuitePlanCase | null };
