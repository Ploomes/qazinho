import { describe, expect, it } from 'vitest';
import { panelWidthOf } from '@/modules/Workspace/library';

const OPEN = { isOpen: true, sidebarWidth: 268 };

describe('panelWidthOf', () => {
  it('keeps the width the QA gave it, with its handle beside it', () => {
    expect(panelWidthOf({ ...OPEN, width: 560, windowWidth: 1600 })).toEqual({
      inner: 560,
      outer: 565,
    });
  });

  it('narrows so the center still fits, and never below its least width', () => {
    expect(panelWidthOf({ ...OPEN, width: 900, windowWidth: 1280 }).inner).toBe(587);
    expect(panelWidthOf({ ...OPEN, width: 900, windowWidth: 900 }).inner).toBe(320);
  });

  it('takes all the room when the chat is alone', () => {
    expect(
      panelWidthOf({ ...OPEN, width: 560, windowWidth: 1600, isAlone: true }),
    ).toEqual({ inner: 1327, outer: 1332 });
  });

  it('stands as the rail alone while shut', () => {
    expect(
      panelWidthOf({
        width: 560,
        windowWidth: 1440,
        isOpen: false,
        sidebarWidth: 268,
      }).outer,
    ).toBe(46);
  });

  it('gives the room a folded sidebar leaves to the center and the panel', () => {
    expect(
      panelWidthOf({ ...OPEN, width: 900, windowWidth: 1280, sidebarWidth: 56 }).inner,
    ).toBe(799);
  });
});
