import { describe, expect, it } from 'vitest';
import { joinBytes } from '@/services/Recorder/classes/video/FrameRecorder/library';

describe('joinBytes', () => {
  it('puts the second run of bytes after the first', () => {
    expect([...joinBytes(new Uint8Array([1, 2]), new Uint8Array([3]))]).toEqual([
      1, 2, 3,
    ]);
  });

  it('hands the new bytes back as they are when nothing came before', () => {
    const tail = new Uint8Array([7]);

    expect(joinBytes(new Uint8Array(), tail)).toBe(tail);
  });
});
