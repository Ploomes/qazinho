import type { ISuiteChangeFile } from './ISuiteChangeFile';
import type { ISuiteChangeMessage } from './ISuiteChangeMessage';
import type { ISuiteResult } from './ISuiteResult';
import type { ISuiteShipped } from './ISuiteShipped';
import type { SuiteChangeAsk } from './SuiteChangeAsk';
import type { SuiteChangeFailure } from './SuiteChangeFailure';
import type { SuiteChangeStatus } from './SuiteChangeStatus';
import type { SuiteChangeStep } from './SuiteChangeStep';

/**
 * A change the QA's agent makes to a project's suite on a branch of its own, from ask to
 * review.
 */
export interface ISuiteChange {
  id: string;
  projectId: string;
  ask: SuiteChangeAsk;
  startedAt: number;
  endedAt: number | null;
  status: SuiteChangeStatus;
  step: SuiteChangeStep | null;
  branch: string;
  base: string;
  commit: string;
  summary: string;
  message: ISuiteChangeMessage;
  files: ISuiteChangeFile[];
  checks: ISuiteResult[];
  failure: SuiteChangeFailure | null;
  shipped: ISuiteShipped | null;
}
