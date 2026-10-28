/**
 * Uma linha do diff de um arquivo como a revisão a mostra: a cabeça de um hunk, uma linha
 * adicionada, uma removida ou uma mantida, com o número antes e depois.
 */
export interface IDiffLine {
  key: string;
  kind: 'hunk' | 'add' | 'del' | 'same';
  text: string;
  old: number | null;
  new: number | null;
}
