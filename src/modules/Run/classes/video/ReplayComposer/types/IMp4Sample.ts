/**
 * Um frame do vídeo de um MP4, onde os bytes dele ficam no arquivo e quando ele aparece,
 * em microssegundos.
 */
export interface IMp4Sample {
  offset: number;
  size: number;
  timestampUs: number;
  durationUs: number;
  isKey: boolean;
}
