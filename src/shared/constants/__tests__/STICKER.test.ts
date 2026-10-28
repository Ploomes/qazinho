import { describe, expect, it } from 'vitest';
import { STICKER } from '@/shared/constants';

const MOVES = [STICKER.slap, STICKER.panel, STICKER.pop, STICKER.rise, STICKER.hero];

describe('STICKER', () => {
  it('lands everything flat: whole, upright and fully opaque', () => {
    for (const move of MOVES)
      expect(move.animate).toMatchObject({ opacity: 1, scale: 1, rotate: 0 });
  });

  it('leaves in under 200ms, quicker than it came in', () => {
    for (const move of MOVES) {
      expect(move.exit.opacity).toBe(0);
      expect(move.exit.transition.duration).toBeLessThan(0.2);
    }
  });

  /**
   * O visual de sticker pesava para trabalhar o dia todo: nada gira, e nada cresce de
   * longe.
   */
  it('comes in without turning, and from barely smaller than it lands', () => {
    for (const move of MOVES) {
      expect(move.initial).not.toHaveProperty('rotate');
      expect('scale' in move.initial ? move.initial.scale : 1).toBeGreaterThanOrEqual(
        0.9,
      );
      expect('scale' in move.initial ? move.initial.scale : 1).toBeLessThanOrEqual(1);
    }
  });

  it('springs with no overshoot to speak of', () => {
    const { stiffness, damping, mass } = STICKER.spring;

    expect(damping / (2 * Math.sqrt(stiffness * mass))).toBeGreaterThanOrEqual(0.8);
  });

  it('picks a dragged thing up without turning it', () => {
    expect(STICKER.drag.scale).toBeGreaterThan(1);
    expect(STICKER.drag).not.toHaveProperty('rotate');
  });

  it('marks an event once, with a small pulse that comes back to size', () => {
    expect(STICKER.wobble.scale.at(0)).toBe(1);
    expect(STICKER.wobble.scale.at(-1)).toBe(1);
    expect(Math.max(...STICKER.wobble.scale)).toBeLessThanOrEqual(1.05);
  });
});
