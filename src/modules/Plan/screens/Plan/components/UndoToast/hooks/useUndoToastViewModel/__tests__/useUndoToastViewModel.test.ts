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
   * A contagem regressiva é uma animação CSS, então passar o mouse no toast a pausa de
   * graça; a duração chega à folha de estilo como custom property.
   */
  it('drains the line for as long as UNDO_TOAST says', () => {
    const { result } = render();

    expect(result.current.style).toEqual({ '--undo-ms': '6000ms' });
  });
});
