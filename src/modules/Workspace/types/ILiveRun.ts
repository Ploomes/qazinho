import type { ILiveQuestion } from './ILiveQuestion';
import type { IWalkedBy } from './IWalkedBy';
import type { IRunSuggestion } from '@/modules/Run/types';
import type { IRunAsked, IStepOutcome } from '@/shared/types';

/** The run in flight: the step it is on, when it started and how long it has been going, what it has decided, and the question its agent waits on and the ones it asked; an exploration says so, and keeps the plan it suggested once it finished. */
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
