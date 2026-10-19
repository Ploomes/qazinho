import { describe, expect, it } from 'vitest';
import { DEVICE } from '@/modules/Device/constants';
import { SHELL } from '@/shared/constants';

/** The smallest window main allows, from WINDOW in src/main, which the page may not import. */
const SMALLEST_WINDOW = 1024;

describe('DEVICE', () => {
  it('fits at its narrowest beside the chat, in the smallest window', () => {
    expect(
      SMALLEST_WINDOW - SHELL.sidebarWidth - SHELL.centerMinWidth - DEVICE.handleWidth,
    ).toBeGreaterThanOrEqual(DEVICE.minWidth);
  });

  it('opens wider than its narrowest, and never past its widest', () => {
    expect(DEVICE.defaultWidth).toBeGreaterThan(DEVICE.minWidth);
    expect(DEVICE.defaultWidth).toBeLessThan(DEVICE.maxWidth);
  });

  it('turns compact only below the width it opens at', () => {
    expect(DEVICE.compactWidth).toBeGreaterThan(DEVICE.minWidth);
    expect(DEVICE.compactWidth).toBeLessThan(DEVICE.defaultWidth);
  });
});
