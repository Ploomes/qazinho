import type { IRunCase } from './IRunCase';
import type { IRunCounts } from './IRunCounts';
import type { RunEnd } from './RunEnd';
import type { IRunVideo } from '@/shared/types';

/** One execution of a selection of cases on one target, with a verdict per step, what the agent said it cost, and its recording once made. */
export interface IRun {
  id: string;
  meta: string;
  startedAt: string;
  durationSec: number;
  costUsd: number | null;
  counts: IRunCounts;
  cases: IRunCase[];
  endedBy: RunEnd;
  video: IRunVideo | null;
}
