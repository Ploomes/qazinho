import type { IReplaySpan } from './IReplaySpan';
import type { StepVerdict } from '@/shared/types';

/** Um passo de um caso onde fica no vídeo, com o bug em que virou, se algum. */
export interface IReplayStep extends IReplaySpan {
  number: number;
  action: string;
  verdict: StepVerdict;
  bugId: string | null;
}
