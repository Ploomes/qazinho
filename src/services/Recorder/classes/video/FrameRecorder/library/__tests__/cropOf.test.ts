import { describe, expect, it } from 'vitest';
import { cropOf } from '@/services/Recorder/classes/video/FrameRecorder/library';

describe('cropOf', () => {
  it('keeps a desktop frame whole', () => {
    expect(cropOf({ width: 1280, height: 800, ratio: 1280 / 800 })).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 800,
    });
  });

  /** Chrome keeps its window 500px wide, so a 390px page arrives framed in 500px. */
  it('cuts a phone-sized page out of the left of the wider frame Chrome sends', () => {
    expect(cropOf({ width: 500, height: 844, ratio: 390 / 844 })).toEqual({
      x: 0,
      y: 0,
      width: 390,
      height: 844,
    });
  });

  it('does NOT widen a frame past its own pixels', () => {
    expect(cropOf({ width: 600, height: 800, ratio: 2 }).width).toBe(600);
  });

  it('shows the frame whole when its screen shape is unknown', () => {
    expect(cropOf({ width: 640, height: 480, ratio: 0 }).width).toBe(640);
  });
});
