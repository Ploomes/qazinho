// @vitest-environment jsdom
import type { IViewportPickerProps } from '@/modules/Device/components/DeviceView/components/ViewportPicker/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useViewportPickerViewModel } from '@/modules/Device/components/DeviceView/components/ViewportPicker/hooks/useViewportPickerViewModel';

const picker = (props: Partial<IViewportPickerProps>) =>
  renderHook(() =>
    useViewportPickerViewModel({
      viewports: [
        { id: 'desktop', label: 'Desktop', size: '1280 × 800', isActive: true },
        { id: 'phone', label: 'Phone', size: '390 × 844', isActive: false },
      ],
      layoutId: 'picker',
      onSelect: vi.fn(),
      ...props,
    }),
  ).result.current;

describe('useViewportPickerViewModel', () => {
  describe('options', () => {
    it('marks the size kept, and only that one', () => {
      expect(picker({}).options.map(({ className }) => className)).toEqual([
        'viewport-picker__option viewport-picker__option--on',
        'viewport-picker__option',
      ]);
    });

    it('hands the size picked to the panel', () => {
      const onSelect = vi.fn();

      picker({ onSelect }).options[1]?.onSelect();

      expect(onSelect).toHaveBeenCalledWith('phone');
    });

    it('offers nothing when the target has no window to size', () => {
      expect(picker({ viewports: [] }).options).toEqual([]);
    });
  });
});
