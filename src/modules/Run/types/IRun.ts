import type { IRunCase } from './IRunCase';
import type { IRunCounts } from './IRunCounts';
import type { RunEnd } from './RunEnd';

/** One execution of a selection of cases on one target, with a verdict per step. */
export interface IRun {
  id: string;
  meta: string;
  startedAt: string;
  durationSec: number;
  counts: IRunCounts;
  cases: IRunCase[];
  endedBy: RunEnd;
}
