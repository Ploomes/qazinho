import type { IBounds } from '@/main/types';

/** Where a window goes for a size: centred on its display and never past it, and never smaller than the QA made it. */
export function fittedBounds(props: {
  size: { width: number; height: number };
  area: IBounds;
  current: IBounds | null;
}): IBounds {
  const { size, area, current } = props;
  const width = Math.min(Math.max(size.width, current?.width ?? 0), area.width);
  const height = Math.min(Math.max(size.height, current?.height ?? 0), area.height);

  if (current !== null && current.width === width && current.height === height)
    return current;

  return {
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2),
    width,
    height,
  };
}
