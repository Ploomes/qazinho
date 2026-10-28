import type { IMp4Sample } from './IMp4Sample';

/**
 * O vídeo H.264 de um MP4 como um decodificador o recebe: o codec, o registro de
 * configuração, o tamanho, e os frames em ordem de decodificação.
 */
export interface IMp4Track {
  codec: string;
  description: Uint8Array;
  width: number;
  height: number;
  samples: IMp4Sample[];
}
