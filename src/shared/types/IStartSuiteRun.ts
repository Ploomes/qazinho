import type { ISuiteBatch } from './ISuiteBatch';

/** A run of a project's suite: its id, the batches it goes through, one Playwright project after the other, and how many tests the page expects them to reach. */
export interface IStartSuiteRun {
  projectId: string;
  runId: string;
  batches: ISuiteBatch[];
  expected: number;
}
