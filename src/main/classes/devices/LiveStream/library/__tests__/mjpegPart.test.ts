import { describe, expect, it } from 'vitest';
import { mjpegPart } from '@/main/classes/devices/LiveStream/library';

describe('mjpegPart', () => {
  it('frames the image with its boundary, type and exact length', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const part = mjpegPart({ boundary: 'b', jpeg }).toString('latin1');

    expect(
      part.startsWith('--b\r\nContent-Type: image/jpeg\r\nContent-Length: 4\r\n\r\n'),
    ).toBe(true);
    expect(part.endsWith('\xff\xd8\xff\xd9\r\n')).toBe(true);
  });
});
