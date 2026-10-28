/**
 * O que o lightbox está mostrando: um screenshot em mãos, ou um ainda no disco para ser
 * lido de volta.
 */
export interface IMedia {
  kicker: string;
  title: string;
  src: string | null;
  file: string | null;
}
