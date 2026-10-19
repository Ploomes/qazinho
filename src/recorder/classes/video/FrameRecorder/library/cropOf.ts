import type { IRect, ISize } from '@/recorder/classes/video/FrameRecorder/types';

/** The part of a frame the screen shows: Chrome keeps a window 500px wide, so a phone-sized page is the left of a wider frame. */
export function cropOf(props: ISize & { ratio: number }): IRect {
  const width =
    props.ratio > 0
      ? Math.min(props.width, Math.round(props.height * props.ratio))
      : props.width;

  return { x: 0, y: 0, width: Math.max(1, width), height: props.height };
}
