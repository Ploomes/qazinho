import type { IMjpegPart } from '@/recorder/classes/video/FrameRecorder/types';

const HEAD_END = [13, 10, 13, 10];

function headEndOf(buffer: Uint8Array): number {
  for (let index = 0; index + HEAD_END.length <= buffer.length; index += 1)
    if (HEAD_END.every((byte, offset) => buffer[index + offset] === byte)) return index;

  return -1;
}

/** Takes the first whole part off an MJPEG body: null while its bytes are still coming, a null part for a block it cannot read. */
export function takeMjpegPart(
  buffer: Uint8Array,
): { part: IMjpegPart | null; rest: Uint8Array } | null {
  const headEnd = headEndOf(buffer);

  if (headEnd < 0) return null;

  const fields = new Map(
    new TextDecoder('latin1')
      .decode(buffer.subarray(0, headEnd))
      .split('\r\n')
      .filter((line) => line.includes(':'))
      .map((line) => {
        const colon = line.indexOf(':');

        return [line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()];
      }),
  );
  const bodyStart = headEnd + HEAD_END.length;
  const length = Number(fields.get('content-length'));

  if (!Number.isInteger(length) || length < 0)
    return { part: null, rest: buffer.subarray(bodyStart) };

  if (buffer.length < bodyStart + length) return null;

  const at = Number(fields.get('x-captured-at'));
  const ratio = Number(fields.get('x-screen-ratio'));

  return {
    part: Number.isFinite(at)
      ? {
          jpeg: buffer.slice(bodyStart, bodyStart + length),
          at,
          ratio: Number.isFinite(ratio) && ratio > 0 ? ratio : 0,
        }
      : null,
    rest: buffer.subarray(bodyStart + length),
  };
}
