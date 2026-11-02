// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIconButtonViewModel } from '@/shared/components/atoms/IconButton/hooks/useIconButtonViewModel';

const PROPS = { icon: 'close' as const, label: 'Close', onClick: vi.fn() };

describe('useIconButtonViewModel', () => {
  it('is the medium square unless another size is asked for', () => {
    const { result } = renderHook(() => useIconButtonViewModel(PROPS));

    expect(result.current.className).toBe('icon-button icon-button--md');
    expect(result.current.iconSize).toBe(16);
  });

  it('draws a smaller icon in the small button', () => {
    const { result } = renderHook(() => useIconButtonViewModel({ ...PROPS, size: 'sm' }));

    expect(result.current.iconSize).toBe(14);
  });

  it('says it opens a popup only when asked, so a click on it is not a click outside it', () => {
    const plain = renderHook(() => useIconButtonViewModel(PROPS));
    const trigger = renderHook(() =>
      useIconButtonViewModel({ ...PROPS, popup: 'dialog' }),
    );

    expect(plain.result.current.popup).toBeUndefined();
    expect(trigger.result.current.popup).toBe('dialog');
  });

  it('marks itself active, because a popover trigger stays lit while it is open', () => {
    const { result } = renderHook(() =>
      useIconButtonViewModel({ ...PROPS, isActive: true, size: 'sm' }),
    );

    expect(result.current.className).toBe(
      'icon-button icon-button--sm icon-button--active',
    );
  });

  it('passes the click straight through', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useIconButtonViewModel({ ...PROPS, onClick }));

    result.current.onIconClick();

    expect(onClick).toHaveBeenCalledOnce();
  });
});
