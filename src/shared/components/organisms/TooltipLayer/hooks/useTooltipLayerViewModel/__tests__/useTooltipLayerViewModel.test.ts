// @vitest-environment jsdom
import type { IShownTip } from '@/store/TooltipStore/types';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTooltipLayerViewModel } from '@/shared/components/organisms/TooltipLayer/hooks/useTooltipLayerViewModel';
import { useTooltipStore } from '@/store';

const row = document.createElement('div');
const tipOf = (id: string, left: number): IShownTip => ({
  id,
  group: row,
  box: { top: 100, left, right: left + 40, bottom: 140, width: 40, height: 40 },
  content: id,
  side: 'right',
  isWide: false,
});

/** O medidor escondido, com o tamanho que o painel vai ter e a largura das palavras. */
function measurer(width: number, height: number): HTMLSpanElement {
  const measure = document.createElement('span');
  const inner = document.createElement('span');

  Object.defineProperty(measure, 'offsetWidth', { value: width });
  Object.defineProperty(measure, 'offsetHeight', { value: height });
  inner.getBoundingClientRect = () => ({ width: width - 18 }) as DOMRect;
  measure.appendChild(inner);

  return measure;
}

function mountedLayer(width = 80, height = 28) {
  const hook = renderHook(() => useTooltipLayerViewModel());

  (hook.result.current.measureRef as { current: HTMLSpanElement | null }).current =
    measurer(width, height);

  return hook;
}

beforeEach(() => {
  useTooltipStore.setState({ tip: null, session: 0, closedAt: 0, lingerTimer: null });
});

describe('useTooltipLayerViewModel', () => {
  it('shows no panel while no tip is open', () => {
    const { result } = mountedLayer();

    expect(result.current.panel).toBeNull();
  });

  it('opens the panel beside its button at the size of its words', () => {
    const { result } = mountedLayer();

    act(() => {
      useTooltipStore.getState().show(tipOf('home', 12));
    });

    expect(result.current.panel?.animate).toEqual({
      opacity: 1,
      x: 58,
      y: 106,
      width: 80,
      height: 28,
    });
    expect(result.current.panel?.label.style).toEqual({ '--tip-width': '62px' });
  });

  it('comes in from a little toward its button', () => {
    const { result } = mountedLayer();

    act(() => {
      useTooltipStore.getState().show(tipOf('home', 12));
    });

    expect(result.current.panel?.initial).toMatchObject({ opacity: 0, x: 54, y: 106 });
  });

  /** Entre dois vizinhos, o painel fechava e abria um novo em vez de deslizar. */
  it('keeps the same panel, sliding to the next button with new words', () => {
    const { result } = mountedLayer();

    act(() => {
      useTooltipStore.getState().show(tipOf('home', 12));
    });

    const first = result.current.panel?.key;

    act(() => {
      useTooltipStore.getState().show(tipOf('bugs', 12));
    });

    expect(result.current.panel?.key).toBe(first);
    expect(result.current.panel?.label.key).toBe('bugs');
  });

  it('sizes a wide tip by its wider limit', () => {
    const { result } = mountedLayer();

    act(() => {
      useTooltipStore.getState().show({ ...tipOf('usage', 12), isWide: true });
    });

    expect(result.current.measureClassName).toContain('tooltip-layer__measure--wide');
  });
});
