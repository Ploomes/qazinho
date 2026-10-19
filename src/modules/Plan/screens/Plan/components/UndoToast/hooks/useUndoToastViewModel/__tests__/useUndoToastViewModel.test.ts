// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUndoToastViewModel } from '@/modules/Plan/screens/Plan/components/UndoToast/hooks/useUndoToastViewModel';

function render() {
  const onUndo = vi.fn();
  const onExpire = vi.fn();
  const { result } = renderHook(() =>
    useUndoToastViewModel({
      text: 'TC-02 removed from the plan',
      actionLabel: 'Undo',
      onUndo,
      onExpire,
    }),
  );

  return { onUndo, onExpire, result };
}

describe('useUndoToastViewModel', () => {
  describe('onUndoClick', () => {
    it('takes the removal back', () => {
      const { onUndo, onExpire, result } = render();

      result.current.onUndoClick();

      expect(onUndo).toHaveBeenCalledOnce();
      expect(onExpire).not.toHaveBeenCalled();
    });
  });

  describe('onCountdownEnd', () => {
    it('lets the removal stand once the line under it has drained', () => {
      const { onUndo, onExpire, result } = render();

      result.current.onCountdownEnd();

      expect(onExpire).toHaveBeenCalledOnce();
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('does NOT let it stand before the line has drained', () => {
      const { onExpire } = render();

      expect(onExpire).not.toHaveBeenCalled();
    });
  });

  /**
   * The countdown is a CSS animation, so hovering the toast pauses it for free; its length
   * reaches the stylesheet as a custom property.
   */
  it('drains the line for as long as UNDO_TOAST says', () => {
    const { result } = render();

    expect(result.current.style).toEqual({ '--undo-ms': '6000ms' });
  });
});
