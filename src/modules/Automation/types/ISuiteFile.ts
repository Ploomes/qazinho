import type { ISuiteTest } from '@/shared/types';

/**
 * Um arquivo de spec de uma suíte na tela: onde está, o nome, e os testes na ordem em que
 * estão escritos.
 */
export interface ISuiteFile {
  path: string;
  name: string;
  tests: ISuiteTest[];
}
