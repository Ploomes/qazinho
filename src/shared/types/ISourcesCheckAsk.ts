import type { ICodeSource } from './ICodeSource';
import type { ISourceSnapshot } from './ISourceSnapshot';

/**
 * As fontes de um plano a conferir: como a história e a página estavam, o código, e os
 * comentários que o próprio QAzinho postou, que não contam como mudança.
 */
export interface ISourcesCheckAsk {
  snapshots: ISourceSnapshot[];
  code: ICodeSource | null;
  posted: string[];
}
