import type { IRunCase } from './IRunCase';
import type { IRunCounts } from './IRunCounts';
import type { IRunSuggestion } from './IRunSuggestion';
import type { RunEnd } from './RunEnd';
import type { IRunAsked, IRunVideo, RunMode } from '@/shared/types';

/**
 * Uma run de alguns casos num alvo: quando, um veredito por passo, o custo e a gravação.
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
  caseIds?: string[];
  mode?: RunMode;
  suggestion?: IRunSuggestion;
  asked?: IRunAsked[];
}
