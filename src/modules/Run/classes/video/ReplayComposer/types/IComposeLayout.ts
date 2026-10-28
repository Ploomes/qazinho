import type { IRect } from './IRect';

/**
 * Onde tudo fica num frame composto: o tamanho, o vídeo em cima, a faixa embaixo, e
 * quanto a faixa é escalada.
 */
export interface IComposeLayout {
  width: number;
  height: number;
  scale: number;
  video: IRect;
  strip: IRect;
}
