// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

describe('ICONS', () => {
  it('draws every icon bold or solid, never in a weight the app does not use', () => {
    expect(
      Object.values(ICONS).every(({ weight }) => weight === 'bold' || weight === 'fill'),
    ).toBe(true);
  });

  it('keeps the media controls solid, the way a player draws them', () => {
    expect([ICONS.play.weight, ICONS.pause.weight, ICONS.stop.weight]).toEqual([
      'fill',
      'fill',
      'fill',
    ]);
  });

  it('gives every name a shape of its own to draw', () => {
    const glyphs = Object.values(ICONS).map(({ glyph }) => glyph);

    expect(glyphs.every((glyph) => typeof glyph === 'object')).toBe(true);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});
