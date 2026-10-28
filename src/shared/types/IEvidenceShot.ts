/**
 * Uma tela que vai com um bug, pelo nome que ela leva no tracker: o arquivo que a run
 * guardou, ou a imagem ainda em mãos.
 */
export interface IEvidenceShot {
  name: string;
  file: string | null;
  src: string | null;
}
