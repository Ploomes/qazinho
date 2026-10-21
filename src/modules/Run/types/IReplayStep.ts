import type { IReplaySpan } from './IReplaySpan';
import type { StepVerdict } from '@/shared/types';

/** One step of a case where it sits in the video, with the bug it became, if any. */
export interface IReplayStep extends IReplaySpan {
  number: number;
  action: string;
  verdict: StepVerdict;
  bugId: string | null;
}
