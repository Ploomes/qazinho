import type { IScreenElement } from '@/main/classes/devices/IosDriver/types';

type Described = {
  AXLabel?: unknown;
  AXValue?: unknown;
  type?: unknown;
  frame?: { x?: unknown; y?: unknown; width?: unknown; height?: unknown };
};

function read(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number.NaN;
}

function toElement(one: Described): IScreenElement[] {
  const label =
    [one.AXLabel, one.AXValue].find((value) => typeof value === 'string') ?? '';
  const [x, y, width, height] = [
    read(one.frame?.x),
    read(one.frame?.y),
    read(one.frame?.width),
    read(one.frame?.height),
  ];

  if ([x, y, width, height].some(Number.isNaN) || width <= 0 || height <= 0) return [];

  return [
    {
      label: String(label),
      role: typeof one.type === 'string' ? one.type : '',
      x: Math.round(x + width / 2),
      y: Math.round(y + height / 2),
    },
  ];
}

/** `idb ui describe-all` has answered with both a JSON array and one object per line; take either. */
export function parseElements(described: string): IScreenElement[] {
  const trimmed = described.trim();

  if (trimmed.length === 0) return [];

  try {
    const whole: unknown = JSON.parse(trimmed);

    if (Array.isArray(whole)) return (whole as Described[]).flatMap(toElement);
  } catch {
    // Not one document, so it is one element per line.
  }

  return trimmed.split('\n').flatMap((line) => {
    try {
      return toElement(JSON.parse(line) as Described);
    } catch {
      return [];
    }
  });
}
