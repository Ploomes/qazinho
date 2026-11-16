import type { ParseKeys } from 'i18next';

/** Uma linha das novidades no menu de ajuda: a manchete de uma versão e o dia dela. */
export interface INewsLine {
  version: string;
  date: string;
  noteKey: ParseKeys;
}
