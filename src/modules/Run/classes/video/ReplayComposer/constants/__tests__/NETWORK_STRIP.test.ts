import { describe, expect, it } from 'vitest';
import { NETWORK_STRIP } from '@/modules/Run/classes/video/ReplayComposer/constants';

describe('NETWORK_STRIP', () => {
  it('fits a whole row of text, with room above and below it', () => {
    expect(NETWORK_STRIP.rowPx).toBeGreaterThan(NETWORK_STRIP.fontPx * 1.6);
  });

  it('keeps the strip a small part of a usual frame', () => {
    const height = NETWORK_STRIP.headPx + NETWORK_STRIP.rows * NETWORK_STRIP.rowPx;

    expect(height / NETWORK_STRIP.baseWidth).toBeLessThan(0.2);
  });

  it('never shrinks the text below what reads on a small frame', () => {
    expect(NETWORK_STRIP.fontPx * NETWORK_STRIP.minScale).toBeGreaterThanOrEqual(8);
  });

  it('slides a new row in from less than half a row away', () => {
    expect(NETWORK_STRIP.riseY).toBeLessThan(NETWORK_STRIP.rowPx / 2);
  });
});
