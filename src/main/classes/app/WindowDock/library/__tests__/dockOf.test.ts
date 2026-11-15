import { describe, expect, it } from 'vitest';
import { dockOf } from '@/main/classes/app/WindowDock/library';

describe('dockOf', () => {
  it('puts the Chrome on the left and QAzinho in a column on the right, with a gap', () => {
    expect(dockOf({ x: 0, y: 38, width: 1512, height: 944 })).toEqual({
      browser: { x: 0, y: 38, width: 1144, height: 944 },
      app: { x: 1152, y: 38, width: 360, height: 944 },
    });
  });

  /** Num monitor à direita do principal, a área começa depois da largura dele. */
  it('keeps both inside a screen that does not start at zero', () => {
    const { browser, app } = dockOf({ x: 1512, y: 25, width: 1920, height: 1055 });

    expect(browser.x).toBe(1512);
    expect(app.x + app.width).toBe(1512 + 1920);
  });

  it('narrows the column on a small screen so the site keeps its width', () => {
    const { browser, app } = dockOf({ x: 0, y: 0, width: 990, height: 700 });

    expect(app.width).toBe(342);
    expect(browser.width).toBe(640);
  });

  it('never makes the column narrower than it can show the steps', () => {
    expect(dockOf({ x: 0, y: 0, width: 800, height: 600 }).app.width).toBe(320);
  });

  it('gives whole pixels', () => {
    const { browser, app } = dockOf({ x: 0.5, y: 24.4, width: 1440.6, height: 875.2 });

    for (const value of [...Object.values(browser), ...Object.values(app)])
      expect(Number.isInteger(value)).toBe(true);
  });
});
