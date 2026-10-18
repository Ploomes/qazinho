import { describe, expect, it } from 'vitest';
import { fittedBounds } from '@/main/library';

const AREA = { x: 0, y: 25, width: 1512, height: 957 };

describe('fittedBounds', () => {
  it('centres a window opening at a size on its display', () => {
    expect(
      fittedBounds({ size: { width: 1120, height: 740 }, area: AREA, current: null }),
    ).toEqual({ x: 196, y: 134, width: 1120, height: 740 });
  });

  it('grows a smaller window to the size, centred again', () => {
    expect(
      fittedBounds({
        size: { width: 1440, height: 900 },
        area: AREA,
        current: { x: 196, y: 134, width: 1120, height: 740 },
      }),
    ).toEqual({ x: 36, y: 54, width: 1440, height: 900 });
  });

  it('leaves a window the QA already made that big where it is', () => {
    const current = { x: 10, y: 30, width: 1500, height: 940 };

    expect(
      fittedBounds({ size: { width: 1440, height: 900 }, area: AREA, current }),
    ).toBe(current);
  });

  it('never goes past a display smaller than the size', () => {
    expect(
      fittedBounds({
        size: { width: 1440, height: 900 },
        area: { x: 0, y: 25, width: 1280, height: 775 },
        current: null,
      }),
    ).toEqual({ x: 0, y: 25, width: 1280, height: 775 });
  });
});
