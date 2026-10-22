import type { ISuitePlanCase } from './ISuitePlanCase';
import type { ISuiteTest } from './ISuiteTest';

/** What the QA asked of their agent in a team's suite: to fix a test that broke, from the run it broke in, or to write a new one from their words or a case of a plan, in a folder or where the suite keeps its like. */
export type SuiteChangeAsk =
  | { kind: 'fix'; test: ISuiteTest; runId: string }
  | { kind: 'write'; text: string; folder: string; source: ISuitePlanCase | null };
