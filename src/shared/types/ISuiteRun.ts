import type { ISuiteResult } from './ISuiteResult';
import type { SuiteFailure } from './SuiteFailure';
import type { SuiteRunStatus } from './SuiteRunStatus';

/**
 * Uma run da suíte de um projeto: quando começou e terminou (ms de epoch), como está,
 * quantos testes tem, como cada um foi, e por que quebrou, com o que o Playwright disse.
 */
export interface ISuiteRun {
  id: string;
  projectId: string;
  startedAt: number;
  endedAt: number | null;
  status: SuiteRunStatus;
  total: number;
  results: ISuiteResult[];
  failure: SuiteFailure | null;
  said: string;
}
