import type { IRect, ISize } from '@/services/Recorder/classes/video/FrameRecorder/types';

/**
 * Where a picture lands in a box it must not stretch in: as large as it fits, centred.
 */
export function fitInto(props: { source: ISize; box: ISize }): IRect {
  const { source, box } = props;
  const scale = Math.min(box.width / source.width, box.height / source.height);
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);

  return {
    x: Math.round((box.width - width) / 2),
    y: Math.round((box.height - height) / 2),
    width,
    height,
  };
}
