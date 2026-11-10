// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFollowEnd } from '@/shared/hooks/useFollowEnd';

/** Uma lista de 1000px numa janela de 200px: o jsdom não mede nada sozinho. */
function fakeList(scrollTop = 0) {
  return Object.assign(
    document.createElement('div'),
    { scrollTo: vi.fn() },
    { scrollTop },
  );
}

function follow(initial: {
  resetKey: string | null;
  callKey?: string | null;
  isOn?: boolean;
}) {
  const list = fakeList();

  Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });

  const hook = renderHook((props) => useFollowEnd<HTMLDivElement>(props), {
    initialProps: initial,
  });

  hook.result.current.listRef.current = list;

  return { ...hook, list };
}

describe('useFollowEnd', () => {
  it('opens a new list at its end', () => {
    const { list, rerender } = follow({ resetKey: 'a' });

    rerender({ resetKey: 'b' });

    expect(list.scrollTop).toBe(1000);
  });

  /** Fora de uma run a lista é o plano inteiro: ela abre no primeiro passo, não no último. */
  it('does NOT move a list while it is off, and goes to its end when it turns on', () => {
    const { list, rerender } = follow({ resetKey: 'a', isOn: false });

    rerender({ resetKey: 'b', isOn: false });

    expect(list.scrollTop).toBe(0);

    rerender({ resetKey: 'b', isOn: true });

    expect(list.scrollTop).toBe(1000);
  });

  /** A lista de passos só existe depois do primeiro passo: nada a seguia quando surgia. */
  it('follows a list that only appeared when it turned on', async () => {
    const { list, rerender } = follow({ resetKey: 'a', isOn: false });

    rerender({ resetKey: 'a', isOn: true });
    list.append(document.createElement('div'));

    await vi.waitFor(() => {
      expect(list.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    });
  });

  it('calls the QA back to the end when something asks for them', () => {
    const { list, rerender } = follow({ resetKey: 'a', callKey: null });

    rerender({ resetKey: 'a', callKey: 'q-1' });

    expect(list.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
  });

  it('does NOT call anyone back when nothing asks', () => {
    const { list, rerender } = follow({ resetKey: 'a', callKey: 'q-1' });

    list.scrollTo = vi.fn();
    rerender({ resetKey: 'a', callKey: null });

    expect(list.scrollTo).not.toHaveBeenCalled();
  });

  /** Uma lista ligada de novo, para os ouvintes de rolagem dela existirem. */
  function watched() {
    const followed = follow({ resetKey: 'a' });

    followed.rerender({ resetKey: 'b' });
    followed.list.scrollTo = vi.fn();

    return followed;
  }

  const frames = () => new Promise((resolve) => setTimeout(resolve, 50));

  it('stops following when the reader scrolls up with the wheel', async () => {
    const { list, result } = watched();

    list.dispatchEvent(new Event('wheel'));
    list.scrollTop = 500;
    act(() => {
      result.current.onFollowScroll();
    });
    list.append(document.createElement('div'));
    await frames();

    expect(list.scrollTo).not.toHaveBeenCalled();
  });

  it('keeps following when the list moved up with no one scrolling', async () => {
    const { list, result } = watched();

    list.scrollTop = 500;
    act(() => {
      result.current.onFollowScroll();
    });
    list.append(document.createElement('div'));

    await vi.waitFor(() => {
      expect(list.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    });
  });

  it('follows again when the scrollbar is let go near the end', async () => {
    const { list, result } = watched();

    list.dispatchEvent(new Event('pointerdown'));
    list.scrollTop = 500;
    act(() => {
      result.current.onFollowScroll();
    });
    list.scrollTop = 790;
    window.dispatchEvent(new Event('pointerup'));
    list.append(document.createElement('div'));

    await vi.waitFor(() => {
      expect(list.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    });
  });

  it('reads a scroll without moving the list', () => {
    const { list, result } = follow({ resetKey: 'a' });

    list.scrollTop = 300;
    act(() => {
      result.current.onFollowScroll();
    });

    expect(list.scrollTop).toBe(300);
  });
});
