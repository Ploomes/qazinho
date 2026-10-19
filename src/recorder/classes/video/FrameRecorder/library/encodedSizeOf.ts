import type { ISize } from '@/recorder/classes/video/FrameRecorder/types';

/** The size a run is encoded at: its first frame's, shrunk to fit `maxSide` and made even, as H.264 asks. */
export function encodedSizeOf(props: ISize & { maxSide: number }): ISize {
  const scale = Math.min(1, props.maxSide / Math.max(props.width, props.height));
  const even = (value: number) => Math.max(2, Math.round((value * scale) / 2) * 2);

  return { width: even(props.width), height: even(props.height) };
}
