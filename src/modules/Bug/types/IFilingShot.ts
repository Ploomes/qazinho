/**
 * Uma tela que vai com um bug: a de antes, a que quebrou, ou a que uma run posterior
 * pegou, com a run de onde veio.
 */
export interface IFilingShot {
  kind: 'before' | 'broke' | 'again' | 'design';
  run: string | null;
  file: string | null;
  src: string | null;
}
