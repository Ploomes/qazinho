// @vitest-environment jsdom
import type { ChangeEvent, KeyboardEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlanNameViewModel } from '@/modules/Workspace/components/PlanName/hooks/usePlanNameViewModel';

function typed(value: string) {
  return { target: { value } } as ChangeEvent<HTMLInputElement>;
}

function pressed(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLInputElement>;
}

function editing(onRename = vi.fn()) {
  const view = renderHook(() => usePlanNameViewModel({ name: 'Tudo ok', onRename }));

  act(() => {
    view.result.current.onStart();
  });

  return { ...view, onRename };
}

describe('usePlanNameViewModel', () => {
  describe('onStart', () => {
    it('turns the name into a field that starts from the current name', () => {
      const { result } = editing();

      expect(result.current.isEditing).toBe(true);
      expect(result.current.draft).toBe('Tudo ok');
    });
  });

  describe('onKeyDown', () => {
    it('renames on Enter, trimmed', () => {
      const { result, onRename } = editing();

      act(() => {
        result.current.onChange(typed('  Checkout  '));
      });
      act(() => {
        result.current.onKeyDown(pressed('Enter'));
      });

      expect(onRename).toHaveBeenCalledWith('Checkout');
      expect(result.current.isEditing).toBe(false);
    });

    it('drops the edit on Escape, and keeps the old name', () => {
      const { result, onRename } = editing();

      act(() => {
        result.current.onChange(typed('Checkout'));
      });
      act(() => {
        result.current.onKeyDown(pressed('Escape'));
      });

      expect(onRename).not.toHaveBeenCalled();
      expect(result.current.draft).toBe('Tudo ok');
    });
  });

  describe('onCommit', () => {
    it('saves when the field loses focus', () => {
      const { result, onRename } = editing();

      act(() => {
        result.current.onChange(typed('Checkout'));
      });
      act(() => {
        result.current.onCommit();
      });

      expect(onRename).toHaveBeenCalledWith('Checkout');
    });

    it('does NOT rename to an empty name, or to the same one', () => {
      const { result, onRename } = editing();

      act(() => {
        result.current.onChange(typed('   '));
      });
      act(() => {
        result.current.onCommit();
      });
      act(() => {
        result.current.onStart();
      });
      act(() => {
        result.current.onCommit();
      });

      expect(onRename).not.toHaveBeenCalled();
    });
  });
});
