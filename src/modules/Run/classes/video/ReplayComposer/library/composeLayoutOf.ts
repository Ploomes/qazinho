import type { IComposeLayout } from '@/modules/Run/classes/video/ReplayComposer/types';
import { NETWORK_STRIP } from '@/modules/Run/classes/video/ReplayComposer/constants';

function evenOf(value: number): number {
  return Math.ceil(value / 2) * 2;
}

/** The composed frame for a video of this size: the video on top, centred on a frame wide enough for the strip to read, and the strip under it. */
export function composeLayoutOf(props: {
  width: number;
  height: number;
}): IComposeLayout {
  const width = evenOf(Math.max(props.width, NETWORK_STRIP.minWidth));
  const scale = Math.max(NETWORK_STRIP.minScale, width / NETWORK_STRIP.baseWidth);
  const videoHeight = evenOf(props.height);
  const stripHeight = evenOf(
    (NETWORK_STRIP.headPx +
      NETWORK_STRIP.rows * NETWORK_STRIP.rowPx +
      NETWORK_STRIP.bottomPx) *
      scale,
  );

  return {
    width,
    height: videoHeight + stripHeight,
    scale,
    video: {
      x: Math.floor((width - props.width) / 2),
      y: 0,
      width: props.width,
      height: props.height,
    },
    strip: { x: 0, y: videoHeight, width, height: stripHeight },
  };
}
