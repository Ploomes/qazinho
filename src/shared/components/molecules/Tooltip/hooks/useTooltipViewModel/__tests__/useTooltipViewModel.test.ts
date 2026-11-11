// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTooltipViewModel } from '@/shared/components/molecules/Tooltip/hooks/useTooltipViewModel';

describe('useTooltipViewModel', () => {
  it('stays hidden until the pointer or the focus arrives', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    expect(result.current.isOpen).toBe(false);
  });

  it('wraps a long tip at a width it never grows past', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    expect(result.current.style).toEqual({ '--tooltip-max': '240px' });
  });

  it('opens on arrival and closes on leaving', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });

    expect(result.current.isOpen).toBe(false);
  });

  /** Alinhada pela direita, a dica de algo perto da esquerda saía da janela. */
  it('hangs from the left of what it names when the right would leave the window', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));
    const anchor = document.createElement('span');

    anchor.getBoundingClientRect = () =>
      ({ top: 10, bottom: 30, left: 120, right: 220, height: 20 }) as DOMRect;
    result.current.anchorRef.current = anchor;

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.style).toMatchObject({ '--tooltip-left': '120px' });
    expect(result.current.style).not.toHaveProperty('--tooltip-right');
  });

  it('does NOT open while it is off', () => {
    const { result } = renderHook(() => useTooltipViewModel({ isOff: true }));

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(false);
  });

  /**
   * Na sidebar dobrada, uma dica sob a linha dela era cortada pela própria borda do
   * trilho.
   */
  it('opens beside what it names, centred on it, a little gap away', () => {
    const { result } = renderHook(() => useTooltipViewModel({ side: 'right' }));

    (result.current.anchorRef as { current: unknown }).current = {
      getBoundingClientRect: () => ({ top: 100, height: 40, right: 56 }),
    };

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isBeside).toBe(true);
    expect(result.current.panelClassName).toBe('tooltip__panel tooltip__panel--beside');
    expect(result.current.style).toMatchObject({
      '--tooltip-top': '120px',
      '--tooltip-left': '62px',
    });
  });

  /**
   * O botão de dobrar fica no pé da janela, e a dica dele, centrada nele, ficava metade
   * para fora da borda.
   */
  it('keeps a tip beside something at the window foot inside the window', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    const { result } = renderHook(() => useTooltipViewModel({ side: 'right' }));

    (result.current.anchorRef as { current: unknown }).current = {
      getBoundingClientRect: () => ({ top: 870, height: 28, right: 56 }),
    };

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.style).toMatchObject({ '--tooltip-top': '868px' });
  });

  it('opens under what it names unless asked to sit beside it', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    expect(result.current.isBeside).toBe(false);
    expect(result.current.panelClassName).toBe('tooltip__panel');
  });

  /**
   * Uma dica sob o X de um aviso que abre e fecha era cortada pela caixa dele, que esconde
   * o que passa da borda enquanto anima: a dica agora fica fixa na janela, fora da caixa.
   */
  it('pins a tip under what it names to the window, right edges lined up', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });

    const { result } = renderHook(() => useTooltipViewModel({}));

    (result.current.anchorRef as { current: unknown }).current = {
      getBoundingClientRect: () => ({ top: 300, bottom: 328, height: 28, right: 1150 }),
    };

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.style).toMatchObject({
      '--tooltip-top': '334px',
      '--tooltip-right': '50px',
    });
  });

  /**
   * O botão de Recursos abre um popover com o próprio nome: o tooltip aberto pelo hover
   * continuava em cima dele depois do clique.
   */
  it('closes an open tip once it is turned off, as a popover opens', () => {
    const { result, rerender } = renderHook(
      (props: { isOff: boolean }) => useTooltipViewModel(props),
      { initialProps: { isOff: false } },
    );

    act(() => {
      result.current.onOpen();
    });
    rerender({ isOff: true });

    expect(result.current.isOpen).toBe(false);
  });
});
