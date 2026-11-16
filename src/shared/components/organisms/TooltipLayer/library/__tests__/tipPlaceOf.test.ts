import { describe, expect, it } from 'vitest';
import { tipPlaceOf } from '@/shared/components/organisms/TooltipLayer/library';

const viewport = { width: 1440, height: 900 };
const boxOf = (corner: [number, number], size: [number, number] = [32, 32]) => ({
  left: corner[0],
  top: corner[1],
  width: size[0],
  height: size[1],
  right: corner[0] + size[0],
  bottom: corner[1] + size[1],
});

describe('tipPlaceOf', () => {
  /** Na sidebar dobrada, a dica sob o botão era cortada pela borda do trilho. */
  it('opens beside what it names, centred on it, a little gap away', () => {
    const place = tipPlaceOf({
      box: boxOf([12, 100], [40, 40]),
      size: { width: 80, height: 28 },
      side: 'right',
      viewport,
    });

    expect(place).toMatchObject({ x: 58, y: 106, tailX: 0, tailY: 14, isAbove: false });
  });

  it('keeps a side tip inside the window near its foot, the tail still on the button', () => {
    const place = tipPlaceOf({
      box: boxOf([12, 870], [40, 24]),
      size: { width: 80, height: 40 },
      side: 'right',
      viewport,
    });

    expect(place.y).toBe(852);
    expect(place.tailY).toBe(30);
  });

  it('hangs below, its right edge on the right of what it names, the tail on its centre', () => {
    const place = tipPlaceOf({
      box: boxOf([600, 10]),
      size: { width: 120, height: 28 },
      side: 'below',
      viewport,
    });

    expect(place).toMatchObject({ x: 512, y: 48, tailX: 104, tailY: 0, isAbove: false });
  });

  /** Alinhada pela direita, a dica de algo perto da esquerda saía da janela. */
  it('hangs from the left of what it names when the right would leave the window', () => {
    const place = tipPlaceOf({
      box: boxOf([20, 10]),
      size: { width: 200, height: 28 },
      side: 'below',
      viewport,
    });

    expect(place.x).toBe(20);
    expect(place.tailX).toBe(16);
  });

  it('opens above what it names when the window has no room below it', () => {
    const place = tipPlaceOf({
      box: boxOf([600, 860]),
      size: { width: 120, height: 28 },
      side: 'below',
      viewport,
    });

    expect(place).toMatchObject({ y: 826, tailY: 28, isAbove: true });
  });

  it('never puts the tail past the round corner of a tip wider than its button', () => {
    const place = tipPlaceOf({
      box: boxOf([1430, 10], [4, 20]),
      size: { width: 100, height: 28 },
      side: 'below',
      viewport,
    });

    expect(place.tailX).toBe(90);
  });
});
