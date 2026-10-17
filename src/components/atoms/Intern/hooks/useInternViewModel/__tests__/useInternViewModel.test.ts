// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useInternViewModel } from '@/components/atoms/Intern/hooks/useInternViewModel';
import { useAppStore } from '@/store';

function styleOf(result: { current: ReturnType<typeof useInternViewModel> }) {
  return result.current.style as Record<string, string | number>;
}

beforeEach(() => {
  useAppStore.setState({ theme: 'dark' });
});

describe('useInternViewModel', () => {
  it('names the Estagiário and his mood, so the picture is never the only clue', () => {
    const { result } = renderHook(() => useInternViewModel({ mood: 'bug' }));

    expect(result.current.alt).toBe('Intern, found a bug');
  });

  it('plays the strip made for the theme, so his marks never vanish on Tinta', () => {
    const dark = renderHook(() => useInternViewModel({ mood: 'sleeping' }));

    expect(styleOf(dark.result)['--intern-sheet']).toContain(
      'estagiario-dormindo-escuro',
    );

    useAppStore.setState({ theme: 'light' });

    const light = renderHook(() => useInternViewModel({ mood: 'sleeping' }));

    expect(styleOf(light.result)['--intern-sheet']).not.toContain('-escuro');
  });

  it('plays every frame at the pace of the original animation', () => {
    const { result } = renderHook(() =>
      useInternViewModel({ mood: 'sleeping', size: 40 }),
    );

    expect(styleOf(result)).toMatchObject({
      '--intern-size': '40px',
      '--intern-frames': 48,
      '--intern-duration': '2880ms',
    });
  });
});
