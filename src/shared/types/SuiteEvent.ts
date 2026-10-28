import type { ISuiteResult } from './ISuiteResult';
import type { ISuiteRun } from './ISuiteRun';

/**
 * O que a main conta à página enquanto uma suíte roda: a run começando, quantos testes
 * tem, um teste começando, o passo em que está, um teste terminando, e a run terminando.
 */
export type SuiteEvent =
  | { kind: 'started'; run: ISuiteRun }
  | { kind: 'total'; projectId: string; runId: string; total: number }
  | { kind: 'testStarted'; projectId: string; runId: string; testId: string }
  | { kind: 'step'; projectId: string; runId: string; testId: string; title: string }
  | { kind: 'testEnded'; projectId: string; runId: string; result: ISuiteResult }
  | { kind: 'ended'; run: ISuiteRun };
