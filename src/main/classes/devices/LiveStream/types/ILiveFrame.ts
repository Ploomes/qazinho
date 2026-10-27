/**
 * A frame of a device as it was captured: the image, when, in epoch ms, and the
 * width-to-height shape of the screen it shows.
 */
export interface ILiveFrame {
  jpeg: Buffer;
  at: number;
  ratio: number;
}
