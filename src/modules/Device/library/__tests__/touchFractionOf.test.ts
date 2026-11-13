import { describe, expect, it } from 'vitest';
import { touchFractionOf } from '@/modules/Device/library';

const rect = { left: 100, top: 50, width: 400, height: 800 };

describe('touchFractionOf', () => {
  it('turns a point on the screen shown into fractions of it', () => {
    expect(touchFractionOf({ clientX: 300, clientY: 250, rect })).toEqual({
      x: 0.5,
      y: 0.25,
    });
  });

  it('keeps a point past an edge on the edge', () => {
    expect(touchFractionOf({ clientX: 0, clientY: 900, rect })).toEqual({ x: 0, y: 1 });
  });

  it('does NOT divide by a screen with no size', () => {
    expect(
      touchFractionOf({
        clientX: 10,
        clientY: 10,
        rect: { ...rect, width: 0, height: 0 },
      }),
    ).toEqual({ x: 0, y: 0 });
  });
});
