import type { ISuiteResult } from './ISuiteResult';
import type { SuiteFailure } from './SuiteFailure';
import type { SuiteRunStatus } from './SuiteRunStatus';

/**
 * A run of a project's suite: when it started and ended (epoch ms), how it stands, how
 * many tests it holds, how each went, and why it broke, with what Playwright said.
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
