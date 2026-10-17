// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFileFieldViewModel } from '@/shared/components/molecules/FileField/hooks/useFileFieldViewModel';

const PROPS = {
  value: '',
  placeholder: 'drop your .apk here, or pick one',
  label: 'Android',
  onPick: vi.fn(),
};

describe('useFileFieldViewModel', () => {
  it('asks for a build until one is picked', () => {
    const { result } = renderHook(() => useFileFieldViewModel(PROPS));

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.text).toBe('drop your .apk here, or pick one');
  });

  it('shows which build was picked, not the folder it came from', () => {
    const { result } = renderHook(() =>
      useFileFieldViewModel({ ...PROPS, value: '/Users/qa/builds/shop-debug.apk' }),
    );

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.text).toBe('shop-debug.apk');
  });

  it('a path that is only a name is shown whole', () => {
    const { result } = renderHook(() =>
      useFileFieldViewModel({ ...PROPS, value: 'shop.apk' }),
    );

    expect(result.current.text).toBe('shop.apk');
  });

  it('a value of only spaces still asks for a build', () => {
    const { result } = renderHook(() => useFileFieldViewModel({ ...PROPS, value: '  ' }));

    expect(result.current.isEmpty).toBe(true);
  });

  it('opens the picker when the field is clicked', () => {
    const onPick = vi.fn();
    const { result } = renderHook(() => useFileFieldViewModel({ ...PROPS, onPick }));

    result.current.onFieldClick();

    expect(onPick).toHaveBeenCalledTimes(1);
  });
});
