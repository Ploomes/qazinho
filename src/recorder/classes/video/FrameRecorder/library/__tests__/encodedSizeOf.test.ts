import { describe, expect, it } from 'vitest';
import { encodedSizeOf } from '@/recorder/classes/video/FrameRecorder/library';

describe('encodedSizeOf', () => {
  it('keeps a frame that fits as it is', () => {
    expect(encodedSizeOf({ width: 1280, height: 800, maxSide: 1280 })).toEqual({
      width: 1280,
      height: 800,
    });
  });

  it('shrinks a frame streamed at twice its size, keeping its shape', () => {
    expect(encodedSizeOf({ width: 2560, height: 1600, maxSide: 1280 })).toEqual({
      width: 1280,
      height: 800,
    });
  });

  it('shrinks a tall phone frame by its height', () => {
    expect(encodedSizeOf({ width: 780, height: 1688, maxSide: 1280 })).toEqual({
      width: 592,
      height: 1280,
    });
  });

  it('makes both sides even, as H.264 asks', () => {
    expect(encodedSizeOf({ width: 391, height: 845, maxSide: 1280 })).toEqual({
      width: 392,
      height: 846,
    });
  });
});
