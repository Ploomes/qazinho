import { describe, expect, it } from 'vitest';
import { PANEL } from '@/modules/Workspace/constants';
import { SHELL } from '@/shared/constants';

/** The smallest window main allows, from WINDOW in src/main, which the page may not import. */
const SMALLEST_WINDOW = 1024;

describe('PANEL', () => {
  it('fits at its narrowest beside the chat, in the smallest window', () => {
    expect(
      SMALLEST_WINDOW - SHELL.sidebarWidth - SHELL.centerMinWidth - PANEL.handleWidth,
    ).toBeGreaterThanOrEqual(PANEL.minWidth);
  });

  it('opens wider than its narrowest, and never past its widest', () => {
    expect(PANEL.defaultWidth).toBeGreaterThan(PANEL.minWidth);
    expect(PANEL.defaultWidth).toBeLessThan(PANEL.maxWidth);
  });
});
