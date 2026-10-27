import type { IRect } from './IRect';

/**
 * Where everything sits on a composed frame: its size, the video on top, the strip under
 * it, and how much the strip is scaled.
 */
export interface IComposeLayout {
  width: number;
  height: number;
  scale: number;
  video: IRect;
  strip: IRect;
}
