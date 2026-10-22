import type { ISuiteTest } from './ISuiteTest';

/** What the QA asked of their agent in a team's suite: to fix a test that broke, from the run it broke in. */
export type SuiteChangeAsk = { kind: 'fix'; test: ISuiteTest; runId: string };
