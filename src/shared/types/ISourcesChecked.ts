import type { ICodeSource } from './ICodeSource';
import type { ISourceChange } from './ISourceChange';
import type { ISourceSnapshot } from './ISourceSnapshot';

/**
 * O que a conferência das fontes achou: o que mudou, como cada fonte está agora, e as que
 * ela não conseguiu ler.
 */
export interface ISourcesChecked {
  changes: ISourceChange[];
  snapshots: ISourceSnapshot[];
  code: ICodeSource | null;
  missed: string[];
}
