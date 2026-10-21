import { describe, expect, it } from 'vitest';
import { devicePanelWidthOf } from '@/modules/Device/library';

describe('devicePanelWidthOf', () => {
  it('keeps the width the QA gave it, with its handle beside it', () => {
    expect(devicePanelWidthOf({ width: 470, windowWidth: 1440, isOpen: true })).toEqual({
      inner: 470,
      outer: 475,
    });
  });

  it('narrows so the center column still fits, and never below its least width', () => {
    expect(
      devicePanelWidthOf({ width: 780, windowWidth: 1280, isOpen: true }).inner,
    ).toBe(587);
    expect(devicePanelWidthOf({ width: 780, windowWidth: 900, isOpen: true }).inner).toBe(
      320,
    );
  });

  it('stands as the rail alone while shut', () => {
    expect(
      devicePanelWidthOf({ width: 470, windowWidth: 1440, isOpen: false }).outer,
    ).toBe(46);
  });
});
