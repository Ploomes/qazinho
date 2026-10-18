import type { IRunCase } from './IRunCase';
import type { IRunCounts } from './IRunCounts';
import type { RunEnd } from './RunEnd';

/** One execution of a selection of cases on one target, with a verdict per step and what the agent said it cost, when it said. */
export interface IRun {
  id: string;
  meta: string;
  startedAt: string;
  durationSec: number;
  costUsd: number | null;
  counts: IRunCounts;
  cases: IRunCase[];
  endedBy: RunEnd;
}
