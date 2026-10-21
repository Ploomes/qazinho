import { describe, expect, it } from 'vitest';
import { fillersBetween } from '@/modules/Run/classes/video/ReplayComposer/library';

describe('fillersBetween', () => {
  it('holds the picture once a step between two frames far apart', () => {
    expect(fillersBetween({ fromUs: 0, toUs: 350_000, stepUs: 100_000 })).toEqual([
      100_000, 200_000, 300_000,
    ]);
  });

  it('adds nothing between two frames closer than a step', () => {
    expect(fillersBetween({ fromUs: 0, toUs: 80_000, stepUs: 100_000 })).toEqual([]);
  });

  it('never lands on the next frame itself', () => {
    expect(fillersBetween({ fromUs: 0, toUs: 200_000, stepUs: 100_000 })).toEqual([
      100_000,
    ]);
  });

  it('adds nothing for a step that would never move', () => {
    expect(fillersBetween({ fromUs: 0, toUs: 1_000, stepUs: 0 })).toEqual([]);
  });
});
