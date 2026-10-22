import type { ISuiteTest } from './ISuiteTest';

/** A suite's tests as Playwright lists them, with its projects in the order its config declares them; or why they could not be listed, with what Playwright said. */
export type SuiteList =
  | { kind: 'listed'; tests: ISuiteTest[]; projects: string[] }
  | {
      kind: 'failed';
      reason: 'no-suite' | 'no-runner' | 'no-node' | 'unreadable';
      said: string;
    };
