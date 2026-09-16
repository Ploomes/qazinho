import type { IRunCase } from './IRunCase';
import type { IRunCounts } from './IRunCounts';

/** One execution of a selection of cases on one target, with a verdict per step. */
export interface IRun {
  id: string;
  title: string;
  what: string;
  meta: string;
  startedAt: string;
  durationSec: number;
  counts: IRunCounts;
  cases: IRunCase[];
}
