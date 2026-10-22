import type { IDesignLink } from '@/shared/types';

/** Where a frame of the design opens in Figma: the design's own link, with its node-id swapped for the frame's. */
export function frameUrlOf(props: { design: IDesignLink; frame: string }): string {
  const url = new URL(props.design.url);

  url.searchParams.set('node-id', props.frame.replace(':', '-'));

  return url.toString();
}
