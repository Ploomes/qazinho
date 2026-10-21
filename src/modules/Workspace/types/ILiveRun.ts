import type { IWalkedBy } from './IWalkedBy';
import type { IRunSuggestion } from '@/modules/Run/types';
import type { IStepOutcome } from '@/shared/types';

/** The run in flight: the step it is on, how long it has been going, and what it has decided; an exploration says so, and keeps the plan it suggested once it finished. */
export interface ILiveRun {
  id: string;
  doingIndex: number;
  isRunning: boolean;
  isDone: boolean;
  elapsedSec: number;
  startedAt: string;
  outcomes: IStepOutcome[];
  shot: string | null;
  streamUrl: string | null;
  costUsd: number | null;
  by: IWalkedBy;
  kind?: 'explore';
  suggestion?: IRunSuggestion;
}
