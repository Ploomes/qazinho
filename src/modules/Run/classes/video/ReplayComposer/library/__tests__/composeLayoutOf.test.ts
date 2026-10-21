import { describe, expect, it } from 'vitest';
import { NETWORK_STRIP } from '@/modules/Run/classes/video/ReplayComposer/constants';
import { composeLayoutOf } from '@/modules/Run/classes/video/ReplayComposer/library';

describe('composeLayoutOf', () => {
  it('puts the video on top at its own size and the strip right under it', () => {
    const layout = composeLayoutOf({ width: 1280, height: 800 });

    expect(layout.video).toEqual({ x: 0, y: 0, width: 1280, height: 800 });
    expect(layout.strip).toMatchObject({ x: 0, y: 800, width: 1280 });
    expect(layout.height).toBe(800 + layout.strip.height);
  });

  it('scales the strip with the width, so it reads the same at any size', () => {
    const wide = composeLayoutOf({ width: 1920, height: 1080 });

    expect(wide.scale).toBe(1920 / NETWORK_STRIP.baseWidth);
    expect(wide.strip.height).toBeGreaterThan(
      composeLayoutOf({ width: 960, height: 600 }).strip.height,
    );
  });

  it('widens the frame for a phone-shaped page, its video centred, never stretched', () => {
    const layout = composeLayoutOf({ width: 590, height: 1280 });

    expect(layout.width).toBe(NETWORK_STRIP.minWidth);
    expect(layout.video).toEqual({ x: 65, y: 0, width: 590, height: 1280 });
    expect(layout.scale).toBe(NETWORK_STRIP.minScale);
  });

  it('keeps every side even, as H.264 asks', () => {
    const layout = composeLayoutOf({ width: 1281, height: 801 });

    expect([layout.width % 2, layout.height % 2, layout.strip.y % 2]).toEqual([0, 0, 0]);
  });
});
