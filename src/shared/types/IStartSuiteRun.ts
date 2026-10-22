import type { ISuiteBatch } from './ISuiteBatch';

/** A run of a project's suite: its id, and the batches it goes through, one Playwright project after the other. */
export interface IStartSuiteRun {
  projectId: string;
  runId: string;
  batches: ISuiteBatch[];
}
