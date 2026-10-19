const PREFIX = 'data:image/png;base64,';

/** Width over height of a PNG screenshot, read from its header alone; null for anything that is not one. */
export function pngRatioOf(dataUrl: string): number | null {
  if (!dataUrl.startsWith(PREFIX)) return null;

  const head = atob(dataUrl.slice(PREFIX.length, PREFIX.length + 32));

  if (head.length < 24) return null;

  const word = (at: number) =>
    ((head.charCodeAt(at) << 24) |
      (head.charCodeAt(at + 1) << 16) |
      (head.charCodeAt(at + 2) << 8) |
      head.charCodeAt(at + 3)) >>>
    0;
  const width = word(16);
  const height = word(20);

  return width > 0 && height > 0 ? width / height : null;
}
