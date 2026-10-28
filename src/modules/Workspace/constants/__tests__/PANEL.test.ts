import { describe, expect, it } from 'vitest';
import { PANEL } from '@/modules/Workspace/constants';
import { SHELL } from '@/shared/constants';

/**
 * A menor janela que a main permite, a partir do WINDOW em src/main, que a página não
 * pode importar.
 */
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
