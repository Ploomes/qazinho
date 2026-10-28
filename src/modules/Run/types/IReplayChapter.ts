import type { IReplaySpan } from './IReplaySpan';
import type { IReplayStep } from './IReplayStep';
import type { StepVerdict } from '@/shared/types';

/** Um caso de uma run como um capítulo do vídeo dela: do primeiro passo ao último. */
export interface IReplayChapter extends IReplaySpan {
  caseId: string;
  title: string;
  verdict: StepVerdict;
  steps: IReplayStep[];
}
