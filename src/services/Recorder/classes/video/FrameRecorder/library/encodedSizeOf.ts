import type { ISize } from '@/services/Recorder/classes/video/FrameRecorder/types';

/**
 * O tamanho em que uma run é codificada: o do primeiro frame, reduzido para caber em
 * `maxSide` e tornado par, como o H.264 pede.
 */
export function encodedSizeOf(props: ISize & { maxSide: number }): ISize {
  const scale = Math.min(1, props.maxSide / Math.max(props.width, props.height));
  const even = (value: number) => Math.max(2, Math.round((value * scale) / 2) * 2);

  return { width: even(props.width), height: even(props.height) };
}
