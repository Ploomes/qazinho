import { describe, expect, it } from 'vitest';
import { BUG_FOCUS } from '@/modules/Device/constants';
import { bugFocusOf } from '@/modules/Device/library';

describe('how close the picture of a bug gets to what is wrong', () => {
  it('leaves something big as it is', () => {
    expect(bugFocusOf({ x: 0, y: 0, width: 1, height: 1 })).toEqual({
      zoom: 1,
      shiftX: 0,
      shiftY: 0,
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    });
  });

  it('gets close to something small, and never closer than it should', () => {
    expect(bugFocusOf({ x: 0.5, y: 0.5, width: 0.01, height: 0.01 }).zoom).toBe(
      BUG_FOCUS.maxZoom,
    );
  });

  it('brings it to the middle when there is room', () => {
    const focus = bugFocusOf({ x: 0.4, y: 0.45, width: 0.1, height: 0.04 });

    expect(focus.left + focus.width / 2).toBeCloseTo(0.5);
    expect(focus.top + focus.height / 2).toBeCloseTo(0.5);
  });

  it.each([
    ['top left', { x: 0.01, y: 0.01, width: 0.1, height: 0.04 }],
    ['bottom right', { x: 0.89, y: 0.95, width: 0.1, height: 0.04 }],
  ])('never shows past the edge of the picture, at the %s', (_, box) => {
    const { zoom, shiftX, shiftY, left, top, width, height } = bugFocusOf(box);

    expect(shiftX).toBeLessThanOrEqual(0);
    expect(shiftY).toBeLessThanOrEqual(0);
    expect(shiftX + zoom).toBeGreaterThanOrEqual(1);
    expect(shiftY + zoom).toBeGreaterThanOrEqual(1);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(1);
    expect(top + height).toBeLessThanOrEqual(1);
  });

  it('keeps the thing wholly in view after the zoom', () => {
    const { left, width } = bugFocusOf({ x: 0.2, y: 0.5, width: 0.3, height: 0.05 });

    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(1);
  });
});
