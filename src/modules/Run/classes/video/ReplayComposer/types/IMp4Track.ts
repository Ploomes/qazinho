import type { IMp4Sample } from './IMp4Sample';

/** An MP4's H.264 video as a decoder takes it: the codec, its configuration record, its size, and its frames in decoding order. */
export interface IMp4Track {
  codec: string;
  description: Uint8Array;
  width: number;
  height: number;
  samples: IMp4Sample[];
}
