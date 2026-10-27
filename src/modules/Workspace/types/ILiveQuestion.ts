import type { IRunQuestion } from '@/shared/types';

/**
 * The question a run's agent waits on, as the page follows it: what main said, and how
 * long the QA has let it wait.
 */
export interface ILiveQuestion extends IRunQuestion {
  waitedSec: number;
}
