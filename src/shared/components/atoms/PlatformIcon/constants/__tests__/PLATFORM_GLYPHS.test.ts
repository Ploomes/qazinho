import { describe, expect, it } from 'vitest';
import { PLATFORM_GLYPHS } from '@/shared/components/atoms/PlatformIcon/constants';

describe('PLATFORM_GLYPHS', () => {
  it('draws every platform a target can be, with something on screen for each', () => {
    for (const kind of ['web', 'android', 'ios'] as const) {
      const glyph = PLATFORM_GLYPHS[kind];

      expect(glyph.strokes.length + glyph.fills.length).toBeGreaterThan(0);
    }
  });
});
