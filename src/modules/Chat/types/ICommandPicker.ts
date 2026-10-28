import type { ICommandRow } from './ICommandRow';

/**
 * O que o seletor de comandos mostra para o passo em que o QA está: o título, as
 * escolhas, uma nota, e as teclas.
 */
export interface ICommandPicker {
  heading: string;
  rows: ICommandRow[];
  note: string | null;
  hint: string;
}
