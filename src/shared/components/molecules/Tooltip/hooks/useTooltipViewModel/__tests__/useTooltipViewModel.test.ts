// @vitest-environment jsdom
import type { FocusEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTooltipViewModel } from '@/shared/components/molecules/Tooltip/hooks/useTooltipViewModel';
import { useTooltipStore } from '@/store';

/** Um botão com a âncora da dica dentro de um pai, que é o grupo de vizinhos dela. */
function anchorIn(parent: HTMLElement, left = 10): HTMLSpanElement {
  const anchor = document.createElement('span');

  anchor.getBoundingClientRect = () =>
    ({ top: 10, bottom: 42, left, right: left + 32, width: 32, height: 32 }) as DOMRect;
  parent.appendChild(anchor);

  return anchor;
}

function mounted(
  anchor: HTMLSpanElement,
  props: Parameters<typeof useTooltipViewModel>[0],
) {
  const hook = renderHook((given: typeof props) => useTooltipViewModel(given), {
    initialProps: props,
  });

  (hook.result.current.anchorRef as { current: HTMLSpanElement | null }).current = anchor;

  return hook;
}

const focusOf = (isVisible: boolean) =>
  ({ target: { matches: () => isVisible } }) as unknown as FocusEvent<HTMLSpanElement>;

beforeEach(() => {
  vi.useFakeTimers();
  useTooltipStore.setState({ tip: null, session: 0, closedAt: 0, lingerTimer: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTooltipViewModel', () => {
  it('stays hidden until the pointer or the focus arrives', () => {
    mounted(anchorIn(document.createElement('div')), {
      content: 'Início',
      children: null,
    });

    expect(useTooltipStore.getState().tip).toBeNull();
  });

  /** Passar o mouse por cima de uma fileira de botões abria uma dica em cada um. */
  it('waits a moment before the first tip opens', () => {
    const { result } = mounted(anchorIn(document.createElement('div')), {
      content: 'Início',
      children: null,
    });

    act(() => {
      result.current.onPointerEnter();
    });

    expect(useTooltipStore.getState().tip).toBeNull();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(useTooltipStore.getState().tip?.content).toBe('Início');
  });

  it('does NOT open when the pointer leaves before the wait ends', () => {
    const { result } = mounted(anchorIn(document.createElement('div')), {
      content: 'Início',
      children: null,
    });

    act(() => {
      result.current.onPointerEnter();
      vi.advanceTimersByTime(100);
      result.current.onPointerLeave();
      vi.advanceTimersByTime(200);
    });

    expect(useTooltipStore.getState().tip).toBeNull();
  });

  it('moves the open panel to the next button of the same row, with no new wait', () => {
    const row = document.createElement('div');
    const home = mounted(anchorIn(row, 10), {
      content: 'Início',
      side: 'right',
      children: null,
    });
    const bugs = mounted(anchorIn(row, 60), {
      content: 'Bugs',
      side: 'right',
      children: null,
    });

    act(() => {
      home.result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
    });

    const opened = useTooltipStore.getState().session;

    act(() => {
      bugs.result.current.onPointerEnter();
    });

    expect(useTooltipStore.getState().tip?.content).toBe('Bugs');
    expect(useTooltipStore.getState().tip?.box.left).toBe(60);
    expect(useTooltipStore.getState().session).toBe(opened);
  });

  it('opens fresh, not sliding, at a button in another part of the screen', () => {
    const home = mounted(anchorIn(document.createElement('div')), {
      content: 'Início',
      children: null,
    });
    const send = mounted(anchorIn(document.createElement('div')), {
      content: 'Enviar',
      children: null,
    });

    act(() => {
      home.result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
    });

    const opened = useTooltipStore.getState().session;

    act(() => {
      send.result.current.onPointerEnter();
    });

    expect(useTooltipStore.getState().session).toBe(opened + 1);
  });

  it('opens at once a little after the last tip closed', () => {
    const row = document.createElement('div');
    const home = mounted(anchorIn(row), { content: 'Início', children: null });
    const bugs = mounted(anchorIn(row), { content: 'Bugs', children: null });

    act(() => {
      home.result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
      home.result.current.onPointerLeave();
    });

    expect(useTooltipStore.getState().tip).toBeNull();

    act(() => {
      vi.advanceTimersByTime(100);
      bugs.result.current.onPointerEnter();
    });

    expect(useTooltipStore.getState().tip?.content).toBe('Bugs');
  });

  it('opens on keyboard focus, and not on the focus a click gives', () => {
    const anchor = anchorIn(document.createElement('div'));
    const { result } = mounted(anchor, { content: 'Início', children: null });

    act(() => {
      result.current.onFocus(focusOf(false));
    });

    expect(useTooltipStore.getState().tip).toBeNull();

    act(() => {
      result.current.onFocus(focusOf(true));
    });

    expect(useTooltipStore.getState().tip?.content).toBe('Início');

    act(() => {
      result.current.onBlur();
    });

    expect(useTooltipStore.getState().tip).toBeNull();
  });

  it('does NOT open while it is off, and closes when it turns off', () => {
    const anchor = anchorIn(document.createElement('div'));
    const { result, rerender } = mounted(anchor, {
      content: 'Conta',
      isOff: true,
      children: null,
    });

    act(() => {
      result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
    });

    expect(useTooltipStore.getState().tip).toBeNull();

    rerender({ content: 'Conta', isOff: false, children: null });

    act(() => {
      result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
    });

    expect(useTooltipStore.getState().tip).not.toBeNull();

    rerender({ content: 'Conta', isOff: true, children: null });

    expect(useTooltipStore.getState().tip).toBeNull();
  });

  /** O uso da sessão muda enquanto a dica está aberta, e a dica mostrava o número velho. */
  it('keeps the open tip saying what its button says now', () => {
    const anchor = anchorIn(document.createElement('div'));
    const { result, rerender } = mounted(anchor, { content: '40%', children: null });

    act(() => {
      result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
    });

    rerender({ content: '42%', children: null });

    expect(useTooltipStore.getState().tip?.content).toBe('42%');
  });

  it('says on which side it opens and whether it is wide', () => {
    const anchor = anchorIn(document.createElement('div'));
    const { result } = mounted(anchor, {
      content: 'Uso',
      side: 'right',
      isWide: true,
      children: null,
    });

    act(() => {
      result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
    });

    expect(useTooltipStore.getState().tip).toMatchObject({ side: 'right', isWide: true });
  });

  it('closes its tip when its button leaves the screen', () => {
    const anchor = anchorIn(document.createElement('div'));
    const { result, unmount } = mounted(anchor, { content: 'Início', children: null });

    act(() => {
      result.current.onPointerEnter();
      vi.advanceTimersByTime(150);
    });

    unmount();

    expect(useTooltipStore.getState().tip).toBeNull();
  });

  it('fills its slot when it names a whole column, and hugs what it names otherwise', () => {
    const plain = mounted(anchorIn(document.createElement('div')), {
      content: 'a',
      children: null,
    });
    const filling = mounted(anchorIn(document.createElement('div')), {
      content: 'b',
      isFill: true,
      children: null,
    });

    expect(plain.result.current.className).toBe('tooltip');
    expect(filling.result.current.className).toBe('tooltip tooltip--fill');
  });
});
