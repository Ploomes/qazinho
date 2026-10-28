import type { IComposeLayout } from './IComposeLayout';

/**
 * Uma composição em andamento: o frame desenhado inteiro, a última imagem do vídeo
 * guardada embaixo, onde cada um fica, e o codificador recebendo os frames.
 */
export interface IComposeJob {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
  layer: OffscreenCanvasRenderingContext2D;
  layout: IComposeLayout;
  encoder: VideoEncoder;
}
