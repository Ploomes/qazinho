import type { IImportSource } from './IImportSource';

/**
 * Como foi escolher uma pasta de testes: a pasta lida, o QA fechando o seletor, ou uma
 * pasta vazia ou ilegível.
 */
export type ImportPick =
  | { kind: 'picked'; source: IImportSource }
  | { kind: 'cancelled' }
  | { kind: 'failed'; reason: 'empty' | 'unreadable' };
