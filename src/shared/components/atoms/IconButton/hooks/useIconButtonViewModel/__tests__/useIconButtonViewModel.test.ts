// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIconButtonViewModel } from '@/shared/components/atoms/IconButton/hooks/useIconButtonViewModel';

const PROPS = { glyph: '✕', label: 'Close', onClick: vi.fn() };

describe('useIconButtonViewModel', () => {
  it('is the medium square unless another size is asked for', () => {
    const { result } = renderHook(() => useIconButtonViewModel(PROPS));

    expect(result.current.className).toBe('icon-button icon-button--md');
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
