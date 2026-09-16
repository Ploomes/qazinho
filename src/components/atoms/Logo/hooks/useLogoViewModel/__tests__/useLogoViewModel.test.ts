// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LOGO } from '@/components/atoms/Logo/constants';
import { useLogoViewModel } from '@/components/atoms/Logo/hooks/useLogoViewModel';

describe('useLogoViewModel', () => {
  it('falls back to the titlebar size', () => {
    const { result } = renderHook(() => useLogoViewModel({}));

    expect(result.current.size).toBe(LOGO.defaultSize);
  });

  it('takes the micro drawing below 20px, where the branches would close up', () => {
    const { result } = renderHook(() => useLogoViewModel({ size: 17 }));

    expect(result.current.variant).toBe('micro');
  });

  it('takes the mid drawing between 20 and 39px', () => {
    expect(renderHook(() => useLogoViewModel({ size: 20 })).result.current.variant).toBe(
      'mid',
    );
    expect(renderHook(() => useLogoViewModel({ size: 39 })).result.current.variant).toBe(
      'mid',
    );
  });

  it('takes the full drawing from 40px up, where both branches read', () => {
    expect(renderHook(() => useLogoViewModel({ size: 40 })).result.current.variant).toBe(
      'full',
    );
    expect(renderHook(() => useLogoViewModel({ size: 56 })).result.current.variant).toBe(
      'full',
    );
  });
});
