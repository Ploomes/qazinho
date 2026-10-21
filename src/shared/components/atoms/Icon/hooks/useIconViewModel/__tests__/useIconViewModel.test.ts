// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ICONS } from '@/shared/components/atoms/Icon/constants';
import { useIconViewModel } from '@/shared/components/atoms/Icon/hooks/useIconViewModel';

describe('useIconViewModel', () => {
  it('draws the icon its name stands for, as tall as the text around it', () => {
    const { result } = renderHook(() => useIconViewModel({ name: 'check' }));

    expect(result.current).toMatchObject({
      Glyph: ICONS.check.glyph,
      size: '1em',
      weight: 'bold',
    });
  });

  it('keeps the weight its name is drawn in unless asked to be solid', () => {
    expect(
      renderHook(() => useIconViewModel({ name: 'play' })).result.current.weight,
    ).toBe('fill');
    expect(
      renderHook(() => useIconViewModel({ name: 'check', isFilled: true })).result.current
        .weight,
    ).toBe('fill');
  });

  it('takes the size it is given', () => {
    expect(
      renderHook(() => useIconViewModel({ name: 'close', size: 14 })).result.current.size,
    ).toBe(14);
  });

  /** A 10px check beside 10px text read as a typed ✓, so an icon sized by its text never draws smaller than reads as one. */
  it('keeps an icon sized by its text from drawing smaller than an icon reads', () => {
    expect(
      renderHook(() => useIconViewModel({ name: 'check' })).result.current.className,
    ).toBe('icon icon--fluid');
  });

  it('leaves an icon given a size at that size', () => {
    expect(
      renderHook(() => useIconViewModel({ name: 'check', size: 10 })).result.current
        .className,
    ).toBe('icon');
  });

  it('stays out of what a screen reader says when it has no label', () => {
    expect(
      renderHook(() => useIconViewModel({ name: 'lock' })).result.current,
    ).toMatchObject({ isHidden: true, role: undefined });
  });

  it('reads as an image with its label when it carries one', () => {
    expect(
      renderHook(() => useIconViewModel({ name: 'lock', label: 'Value sealed' })).result
        .current,
    ).toMatchObject({ isHidden: false, role: 'img' });
  });
});
