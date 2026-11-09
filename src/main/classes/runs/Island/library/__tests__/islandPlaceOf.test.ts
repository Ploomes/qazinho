import { describe, expect, it } from 'vitest';
import { islandPlaceOf } from '@/main/classes/runs/Island/library';

const MAC_14 = {
  bounds: { x: 0, y: 0, width: 1512, height: 982 },
  workArea: { x: 0, y: 33, width: 1512, height: 949 },
  notch: 'unknown' as const,
};

describe('islandPlaceOf', () => {
  it('centers the window on the top edge and takes the height of the menu bar as the notch', () => {
    expect(islandPlaceOf({ ...MAC_14, platform: 'darwin' })).toEqual({
      x: 526,
      y: 0,
      width: 460,
      height: 380,
      barHeight: 33,
      notchWidth: 185,
    });
  });

  it('follows a screen that does not start at zero, and a Mac with no notch gets no notch', () => {
    const place = islandPlaceOf({
      bounds: { x: 1512, y: 0, width: 1920, height: 1080 },
      workArea: { x: 1512, y: 25, width: 1920, height: 1055 },
      platform: 'darwin',
      notch: 'unknown',
    });

    expect(place.x).toBe(1512 + 960 - 230);
    expect(place.barHeight).toBe(25);
    expect(place.notchWidth).toBe(0);
  });

  it('has no notch on a Mac whose menu bar takes no room, or on another system', () => {
    const flat = {
      bounds: MAC_14.bounds,
      workArea: { ...MAC_14.workArea, y: 0, height: 982 },
      notch: 'unknown' as const,
    };

    for (const place of [
      islandPlaceOf({ ...flat, platform: 'darwin' }),
      islandPlaceOf({ ...MAC_14, platform: 'win32' }),
      islandPlaceOf({ ...MAC_14, platform: 'linux' }),
    ])
      expect(place).toMatchObject({ barHeight: 28, notchWidth: 0 });
  });

  describe('with the notch macOS measured', () => {
    const measured = (notch: { width: number; height: number } | null, top = 30) =>
      islandPlaceOf({
        ...MAC_14,
        workArea: { ...MAC_14.workArea, y: top },
        platform: 'darwin',
        notch,
      });

    /** Com a barra de menus mais baixa que o notch, a ponta dele aparecia sob a ilha. */
    it('reaches past a notch taller than the menu bar', () => {
      expect(measured({ width: 198.5, height: 32 })).toMatchObject({
        barHeight: 33,
        notchWidth: 199,
      });
    });

    it('keeps the menu bar when it is taller than the notch', () => {
      expect(measured({ width: 185, height: 32 }, 37)).toMatchObject({
        barHeight: 37,
        notchWidth: 185,
      });
    });

    it('wears no notch on a screen macOS says has none, however tall its menu bar', () => {
      expect(measured(null, 37)).toMatchObject({ barHeight: 37, notchWidth: 0 });
    });
  });
});
