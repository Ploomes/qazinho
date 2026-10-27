import type { IComposeLayout } from './IComposeLayout';

/**
 * One composition under way: the frame drawn whole, the video's last picture kept under
 * it, where each sits, and the encoder taking the frames.
 */
export interface IComposeJob {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
  layer: OffscreenCanvasRenderingContext2D;
  layout: IComposeLayout;
  encoder: VideoEncoder;
}
