// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LOGO } from '@/components/atoms/Logo/constants';
import { useLogoViewModel } from '@/components/atoms/Logo/hooks/useLogoViewModel';

describe('useLogoViewModel', () => {
  it('falls back to the titlebar size and the amber token', () => {
    const { result } = renderHook(() => useLogoViewModel({}));

    expect(result.current.size).toBe(LOGO.defaultSize);
    expect(result.current.color).toBe('var(--amber)');
  });

  it('keeps the size and the colour it was given', () => {
    const { result } = renderHook(() => useLogoViewModel({ size: 56, color: '#fff' }));

    expect(result.current.size).toBe(56);
    expect(result.current.color).toBe('#fff');
  });

  it('gives every logo on the page a mask id of its own', () => {
    const first = renderHook(() => useLogoViewModel({}));
    const second = renderHook(() => useLogoViewModel({}));

    expect(first.result.current.maskId).not.toBe(second.result.current.maskId);
  });
});
