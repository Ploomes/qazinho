import { describe, expect, it } from 'vitest';
import { fitInto } from '@/services/Recorder/classes/video/FrameRecorder/library';

describe('fitInto', () => {
  it('fills a box of the same shape', () => {
    expect(
      fitInto({
        source: { width: 2560, height: 1600 },
        box: { width: 1280, height: 800 },
      }),
    ).toEqual({ x: 0, y: 0, width: 1280, height: 800 });
  });

  it('centres a narrower picture with room on both sides, never stretched', () => {
    expect(
      fitInto({ source: { width: 390, height: 844 }, box: { width: 1280, height: 800 } }),
    ).toEqual({ x: 455, y: 0, width: 370, height: 800 });
  });

  it('centres a wider picture with room above and below', () => {
    expect(
      fitInto({
        source: { width: 1280, height: 800 },
        box: { width: 600, height: 1280 },
      }),
    ).toEqual({ x: 0, y: 453, width: 600, height: 375 });
  });
});
