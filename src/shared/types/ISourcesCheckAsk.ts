import type { ICodeSource } from './ICodeSource';
import type { ISourceSnapshot } from './ISourceSnapshot';

/** As fontes de um plano a conferir: como a história e a página estavam, e o código. */
export interface ISourcesCheckAsk {
  snapshots: ISourceSnapshot[];
  code: ICodeSource | null;
}
