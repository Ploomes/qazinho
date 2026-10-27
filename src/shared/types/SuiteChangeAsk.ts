import type { ISuitePlanCase } from './ISuitePlanCase';
import type { ISuiteTest } from './ISuiteTest';

/**
 * What the QA asked of their agent in a team's suite: fix a broken test, or write a new
 * one.
 */
export type SuiteChangeAsk =
  | { kind: 'fix'; test: ISuiteTest; runId: string }
  | { kind: 'write'; text: string; folder: string; source: ISuitePlanCase | null };
