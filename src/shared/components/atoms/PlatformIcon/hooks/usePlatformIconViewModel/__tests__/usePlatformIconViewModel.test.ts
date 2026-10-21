// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PLATFORM_ICONS } from '@/shared/components/atoms/PlatformIcon/constants';
import { usePlatformIconViewModel } from '@/shared/components/atoms/PlatformIcon/hooks/usePlatformIconViewModel';

describe('usePlatformIconViewModel', () => {
  it('draws the platform it was given, at a size that sits in a line of text', () => {
    const { result } = renderHook(() => usePlatformIconViewModel({ kind: 'android' }));

    expect(result.current.size).toBe(14);
    expect(result.current.icon).toBe(PLATFORM_ICONS.android);
  });

  it('takes a larger size when one is asked for', () => {
    const { result } = renderHook(() =>
      usePlatformIconViewModel({ kind: 'ios', size: 18 }),
    );

    expect(result.current.size).toBe(18);
  });
});
