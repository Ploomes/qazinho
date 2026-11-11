// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProjectMarkViewModel } from '@/modules/Project/components/ProjectMark/hooks';

describe('useProjectMarkViewModel', () => {
  it('draws the icon of the site on no background of its own', () => {
    const { result } = renderHook(() =>
      useProjectMarkViewModel({
        mark: { kind: 'icon', src: 'data:image/png;base64,A' },
        size: 20,
      }),
    );

    expect(result.current).toMatchObject({
      className: 'project-mark project-mark--icon',
      src: 'data:image/png;base64,A',
      platform: null,
      initial: null,
    });
  });

  it('draws a platform or an initial inside the square, a glyph a bit smaller than it', () => {
    const platform = renderHook(() =>
      useProjectMarkViewModel({
        mark: { kind: 'platform', platform: 'android' },
        size: 20,
      }),
    ).result.current;
    const initial = renderHook(() =>
      useProjectMarkViewModel({ mark: { kind: 'initial', initial: 'L' }, size: 20 }),
    ).result.current;

    expect(platform).toMatchObject({
      className: 'project-mark',
      platform: 'android',
      src: null,
    });
    expect(initial).toMatchObject({ initial: 'L', platform: null });
    expect(platform.glyphSize).toBe(14);
  });

  it('hands the stylesheet the side of the square', () => {
    const { result } = renderHook(() =>
      useProjectMarkViewModel({ mark: { kind: 'initial', initial: 'L' }, size: 24 }),
    );

    expect(result.current.style).toEqual({ '--project-mark': '24px' });
  });
});
