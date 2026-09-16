import type { IStepOutcome } from '@/types';

/** The run in flight: the step it is on, how long it has been going, and what it has decided. */
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
}
