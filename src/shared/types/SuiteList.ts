import type { ISuiteTest } from './ISuiteTest';
import type { SuiteFailure } from './SuiteFailure';

/**
 * A suite's tests as Playwright lists them, with its projects in the order its config
 * declares them; or why they could not be listed, with what Playwright said.
 */
export type SuiteList =
  | { kind: 'listed'; tests: ISuiteTest[]; projects: string[] }
  | { kind: 'failed'; reason: SuiteFailure; said: string };
