import type { IRunCase } from './IRunCase';
import type { IRunCounts } from './IRunCounts';
import type { IRunSuggestion } from './IRunSuggestion';
import type { RunEnd } from './RunEnd';
import type { IRunAsked, IRunVideo } from '@/shared/types';

/**
 * One run of some cases on one target: when, a verdict per step, its cost and its
 * recording.
 */
export interface IRun {
  id: string;
  meta: string;
  startedAt: string;
  startedAtMs?: number;
  durationSec: number;
  costUsd: number | null;
  counts: IRunCounts;
  cases: IRunCase[];
  endedBy: RunEnd;
  video: IRunVideo | null;
  kind?: 'explore';
  suggestion?: IRunSuggestion;
  asked?: IRunAsked[];
}
