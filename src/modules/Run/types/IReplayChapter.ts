import type { IReplaySpan } from './IReplaySpan';
import type { IReplayStep } from './IReplayStep';
import type { StepVerdict } from '@/shared/types';

/** One case of a run as a chapter of its video: from its first step to its last. */
export interface IReplayChapter extends IReplaySpan {
  caseId: string;
  title: string;
  verdict: StepVerdict;
  steps: IReplayStep[];
}
