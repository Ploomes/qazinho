// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { INTERN } from '@/components/atoms/Intern/constants';
import { useInternViewModel } from '@/components/atoms/Intern/hooks/useInternViewModel';

describe('useInternViewModel', () => {
  it('names the Estagiário and his mood, so the picture is never the only clue', () => {
    const { result } = renderHook(() => useInternViewModel({ mood: 'bug' }));

    expect(result.current.alt).toBe('Intern, found a bug');
  });

  it('draws at the density of the screen, so he stays sharp on a Retina display', () => {
    window.devicePixelRatio = 2;

    const { result } = renderHook(() =>
      useInternViewModel({ mood: 'neutral', size: 40 }),
    );

    expect(result.current.pixels).toBe(80);
    expect(result.current.style).toEqual({ '--intern-size': '40px' });

    window.devicePixelRatio = 1;
  });

  it('falls back to the size of an empty state', () => {
    const { result } = renderHook(() => useInternViewModel({ mood: 'sleeping' }));

    expect(result.current.pixels).toBe(INTERN.defaultSize);
  });
});
