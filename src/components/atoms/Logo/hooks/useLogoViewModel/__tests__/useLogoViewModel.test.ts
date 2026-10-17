// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LOGO } from '@/components/atoms/Logo/constants';
import { useLogoViewModel } from '@/components/atoms/Logo/hooks/useLogoViewModel';

describe('useLogoViewModel', () => {
  it('falls back to the titlebar size, in lime', () => {
    const { result } = renderHook(() => useLogoViewModel({}));

    expect(result.current.size).toBe(LOGO.defaultSize);
    expect(result.current.className).toBe('logo logo--lime');
  });

  it('goes quiet for an empty state', () => {
    const { result } = renderHook(() => useLogoViewModel({ size: 56, tone: 'quiet' }));

    expect(result.current.className).toBe('logo logo--quiet');
  });
});
