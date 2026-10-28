import type { SuiteFileStatus } from './SuiteFileStatus';

/**
 * Um arquivo que uma mudança tocou: o caminho a partir do repositório, o que foi feito
 * com ele, as linhas que ganhou e perdeu, e o diff unificado.
 */
export interface ISuiteChangeFile {
  path: string;
  status: SuiteFileStatus;
  additions: number;
  deletions: number;
  patch: string;
}
