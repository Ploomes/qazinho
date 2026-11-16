import type { ParseKeys } from 'i18next';

/** Uma versão publicada: quando saiu e o que trouxe, a primeira nota é a manchete. */
export interface IReleaseNote {
  version: string;
  date: string;
  notes: readonly ParseKeys[];
}
