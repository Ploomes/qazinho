// @vitest-environment jsdom
import type { IViewportPickerProps } from '@/modules/Device/components/DeviceView/components/ViewportPicker/types';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useViewportPickerViewModel } from '@/modules/Device/components/DeviceView/components/ViewportPicker/hooks/useViewportPickerViewModel';

const picker = (props: Partial<IViewportPickerProps>) =>
  renderHook(() =>
    useViewportPickerViewModel({
      viewports: [
        { id: 'desktop', label: 'Desktop', size: '1280 × 800', isActive: true },
        { id: 'phone', label: 'Phone', size: '390 × 844', isActive: false },
      ],
      onSelect: vi.fn(),
      ...props,
    }),
  ).result.current;

describe('useViewportPickerViewModel', () => {
  it('names the size kept on its button', () => {
    expect(picker({}).current).toBe('1280 × 800');
  });

  it('hands the size picked to the panel, and closes', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useViewportPickerViewModel({
        viewports: [
          { id: 'desktop', label: 'Desktop', size: '1280 × 800', isActive: true },
          { id: 'phone', label: 'Phone', size: '390 × 844', isActive: false },
        ],
        onSelect,
      }),
    );

    act(() => {
      result.current.onToggle();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.options[1]?.onSelect();
    });

    expect(onSelect).toHaveBeenCalledWith('phone');
    expect(result.current.isOpen).toBe(false);
  });

  it('offers nothing when the target has no window to size', () => {
    expect(picker({ viewports: [] }).options).toEqual([]);
  });
});
