/** A frame read off the live stream: the JPEG, when it was captured in epoch ms, and the width-to-height shape of its screen. */
export interface IMjpegPart {
  jpeg: Uint8Array<ArrayBuffer>;
  at: number;
  ratio: number;
}
