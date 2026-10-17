// @vitest-environment jsdom
import type { ChangeEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useInputViewModel } from '@/shared/components/atoms/Input/hooks/useInputViewModel';

const PROPS = { value: '', onChange: vi.fn(), label: 'project name' };

function typed(value: string) {
  return { target: { value } } as ChangeEvent<HTMLInputElement>;
}

describe('useInputViewModel', () => {
  describe('onInputChange', () => {
    it('hands the caller the text, not the event', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useInputViewModel({ ...PROPS, onChange }));

      result.current.onInputChange(typed('Shop · staging'));

      expect(onChange).toHaveBeenCalledWith('Shop · staging');
    });

    it('reports an emptied field, so a form can go back to invalid', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useInputViewModel({ ...PROPS, onChange }));

      result.current.onInputChange(typed(''));

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('className', () => {
    it('is the bordered field by default', () => {
      const { result } = renderHook(() => useInputViewModel(PROPS));

      expect(result.current.className).toBe('input');
    });

    it('goes mono for a URL and bare inside the composer', () => {
      const { result } = renderHook(() =>
        useInputViewModel({ ...PROPS, isMono: true, isBare: true }),
      );

      expect(result.current.className).toBe('input input--mono input--bare');
    });
  });

  describe('type', () => {
    it('hides what is typed in a secret field, like a token', () => {
      const { result } = renderHook(() =>
        useInputViewModel({ ...PROPS, isSecret: true }),
      );

      expect(result.current.type).toBe('password');
    });

    it('shows what is typed everywhere else', () => {
      const { result } = renderHook(() => useInputViewModel(PROPS));

      expect(result.current.type).toBe('text');
    });
  });
});
