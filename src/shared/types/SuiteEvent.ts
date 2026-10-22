import type { ISuiteResult } from './ISuiteResult';
import type { ISuiteRun } from './ISuiteRun';

/** What main tells the page while a suite runs: the run starting, how many tests it holds, a test starting, the step it is on, a test ending, and the run ending. */
export type SuiteEvent =
  | { kind: 'started'; run: ISuiteRun }
  | { kind: 'total'; projectId: string; runId: string; total: number }
  | { kind: 'testStarted'; projectId: string; runId: string; testId: string }
  | { kind: 'step'; projectId: string; runId: string; testId: string; title: string }
  | { kind: 'testEnded'; projectId: string; runId: string; result: ISuiteResult }
  | { kind: 'ended'; run: ISuiteRun };
