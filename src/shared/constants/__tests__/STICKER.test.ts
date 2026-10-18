import { describe, expect, it } from 'vitest';
import { STICKER } from '@/shared/constants';

const MOVES = [STICKER.slap, STICKER.panel, STICKER.pop, STICKER.rise, STICKER.hero];

describe('STICKER', () => {
  it('lands every sticker flat on the desk: whole, upright and fully opaque', () => {
    for (const move of MOVES)
      expect(move.animate).toMatchObject({ opacity: 1, scale: 1, rotate: 0 });
  });

  it('peels every sticker off in under 200ms, quicker than it came in', () => {
    for (const move of MOVES) {
      expect(move.exit.opacity).toBe(0);
      expect(move.exit.transition.duration).toBeLessThan(0.2);
    }
  });

  it('slaps small stickers from far and panels from close, so a modal does not eat the page', () => {
    expect(STICKER.slap.initial.scale).toBeGreaterThan(STICKER.panel.initial.scale);
    expect(Math.abs(STICKER.panel.initial.rotate)).toBeLessThanOrEqual(2);
  });

  it('springs with a little overshoot, settled well under half a second', () => {
    const { stiffness, damping, mass } = STICKER.spring;
    const ratio = damping / (2 * Math.sqrt(stiffness * mass));

    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(0.75);
  });

  it('picks a dragged sticker up without turning its text past 2°', () => {
    expect(STICKER.drag.scale).toBeGreaterThan(1);
    expect(Math.abs(STICKER.drag.rotate)).toBeLessThanOrEqual(2);
  });

  it('wobbles once and comes back upright', () => {
    expect(STICKER.wobble.rotate.at(0)).toBe(0);
    expect(STICKER.wobble.rotate.at(-1)).toBe(0);
    expect(Math.max(...STICKER.wobble.rotate.map(Math.abs))).toBeLessThanOrEqual(3);
  });
});
