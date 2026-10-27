const HEAD_CHARS = 87_384;

/**
 * Width over height of a screenshot, read from its own bytes, PNG or JPEG, whatever its
 * data URL claims; null when it cannot tell.
 */
export function imageRatioOf(dataUrl: string): number | null {
  const comma = dataUrl.indexOf(',');

  if (!dataUrl.startsWith('data:image/') || comma < 0) return null;

  let bytes: string;

  try {
    bytes = atob(dataUrl.slice(comma + 1, comma + 1 + HEAD_CHARS));
  } catch {
    return null;
  }

  const size = bytes.startsWith('\x89PNG\r\n\x1a\n')
    ? sizeOfPng(bytes)
    : bytes.startsWith('\xff\xd8')
      ? sizeOfJpeg(bytes)
      : null;

  return size !== null && size.width > 0 && size.height > 0
    ? size.width / size.height
    : null;
}

function sizeOfPng(bytes: string): { width: number; height: number } | null {
  const word = (at: number) =>
    ((bytes.charCodeAt(at) << 24) |
      (bytes.charCodeAt(at + 1) << 16) |
      (bytes.charCodeAt(at + 2) << 8) |
      bytes.charCodeAt(at + 3)) >>>
    0;

  return bytes.length < 24 ? null : { width: word(16), height: word(20) };
}

function sizeOfJpeg(bytes: string): { width: number; height: number } | null {
  const half = (at: number) => (bytes.charCodeAt(at) << 8) | bytes.charCodeAt(at + 1);
  let at = 2;

  while (at + 9 < bytes.length && bytes.charCodeAt(at) === 0xff) {
    const marker = bytes.charCodeAt(at + 1);
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isFrame) return { width: half(at + 7), height: half(at + 5) };

    at += 2 + half(at + 2);
  }

  return null;
}
