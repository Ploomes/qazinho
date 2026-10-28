import type { ISuiteFile } from './ISuiteFile';

/**
 * Uma pasta de uma suíte na tela, como os testes de uma história: onde está, o nome, e os
 * arquivos de spec dela.
 */
export interface ISuiteFolder {
  path: string;
  name: string;
  files: ISuiteFile[];
}
