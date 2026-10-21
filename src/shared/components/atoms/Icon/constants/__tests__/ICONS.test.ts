// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

describe('ICONS', () => {
  it('draws every icon bold or solid, never in a weight the app does not use', () => {
    expect(
      Object.values(ICONS).every(({ weight }) => weight === 'bold' || weight === 'fill'),
    ).toBe(true);
  });

  it('draws each status in a solid circle, apart from the bare glyph a control wears', () => {
    expect(
      [
        ICONS.passed,
        ICONS.failed,
        ICONS.skipped,
        ICONS.running,
        ICONS.paused,
        ICONS.stopped,
      ].map(({ weight }) => weight),
    ).toEqual(['fill', 'fill', 'fill', 'fill', 'fill', 'fill']);
    expect([ICONS.check.weight, ICONS.close.weight]).toEqual(['bold', 'bold']);
    expect(ICONS.passed.glyph).not.toBe(ICONS.check.glyph);
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
