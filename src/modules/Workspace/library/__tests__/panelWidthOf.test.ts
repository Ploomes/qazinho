import { describe, expect, it } from 'vitest';
import { panelWidthOf } from '@/modules/Workspace/library';

const OPEN = { isOpen: true, isWide: false };

describe('panelWidthOf', () => {
  it('keeps the width the QA gave it, with its handle beside it', () => {
    expect(panelWidthOf({ ...OPEN, width: 560, windowWidth: 1600 })).toEqual({
      inner: 560,
      outer: 565,
    });
  });

  it('narrows so the chat still fits, and never below its least width', () => {
    expect(panelWidthOf({ ...OPEN, width: 900, windowWidth: 1280 }).inner).toBe(587);
    expect(panelWidthOf({ ...OPEN, width: 900, windowWidth: 900 }).inner).toBe(320);
  });

  it('takes all the room beside the sidebar while widened', () => {
    expect(
      panelWidthOf({ width: 560, windowWidth: 1440, isOpen: true, isWide: true }),
    ).toEqual({ inner: 1167, outer: 1172 });
  });

  it('stands as the rail alone while shut, widened or not', () => {
    expect(
      panelWidthOf({ width: 560, windowWidth: 1440, isOpen: false, isWide: false }).outer,
    ).toBe(46);
    expect(
      panelWidthOf({ width: 560, windowWidth: 1440, isOpen: false, isWide: true }).outer,
    ).toBe(46);
  });
});
