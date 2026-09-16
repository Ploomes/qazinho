import type { StepVerdict } from '@/modules/Run/types';

/** The run in flight: which step it is on, how long it has been going, and what it has decided. */
export interface ILiveRun {
  id: string;
  stepIndex: number;
  isRunning: boolean;
  isDone: boolean;
  elapsedSec: number;
  ticks: number;
  startedAt: string;
  verdicts: StepVerdict[];
}
