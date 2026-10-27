import type { ILiveQuestion } from './ILiveQuestion';
import type { IWalkedBy } from './IWalkedBy';
import type { IRunSuggestion } from '@/modules/Run/types';
import type { IRunAsked, IStepOutcome } from '@/shared/types';

/**
 * The run in flight: its step, its time, what it decided, and the questions its agent
 * asked.
 */
export interface ILiveRun {
  id: string;
  doingIndex: number;
  isRunning: boolean;
  isDone: boolean;
  elapsedSec: number;
  startedAt: string;
  startedAtMs?: number;
  outcomes: IStepOutcome[];
  shot: string | null;
  streamUrl: string | null;
  costUsd: number | null;
  by: IWalkedBy;
  kind?: 'explore';
  suggestion?: IRunSuggestion;
  question?: ILiveQuestion;
  asked?: IRunAsked[];
}
