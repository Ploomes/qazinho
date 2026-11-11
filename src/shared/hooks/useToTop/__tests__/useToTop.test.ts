// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useToTop } from '@/shared/hooks';

/**
 * Um substituto do observer do navegador, que o jsdom não tem: o teste diz quando o topo
 * aparece.
 */
class FakeObserver {
  static last: FakeObserver | null = null;
  public isDisconnected = false;

  public constructor(
    private readonly onChange: (entries: { isIntersecting: boolean }[]) => void,
  ) {
    FakeObserver.last = this;
  }

  public observe(): void {}

  public disconnect(): void {
    this.isDisconnected = true;
  }

  public see(isIntersecting: boolean): void {
    this.onChange([{ isIntersecting }]);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeObserver.last = null;
});

describe('useToTop', () => {
  it('offers the way up once the top of the screen leaves the view, and hides it back', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);

    const { result } = renderHook(() => useToTop());

    act(() => {
      result.current.topRef(document.createElement('div'));
    });

    expect(result.current.isToTopShown).toBe(false);

    act(() => {
      FakeObserver.last?.see(false);
    });

    expect(result.current.isToTopShown).toBe(true);

    act(() => {
      FakeObserver.last?.see(true);
    });

    expect(result.current.isToTopShown).toBe(false);
  });

  /** Rolar o topo até a borda escondia o espaço acima dele, e a primeira linha sob as abas. */
  it('scrolls the list it sits in all the way back to its start', () => {
    const scroller = document.createElement('div');
    const top = document.createElement('div');
    const scrollTo = vi.fn();

    scroller.style.overflowY = 'auto';
    scroller.scrollTo = scrollTo as typeof scroller.scrollTo;
    scroller.append(top);

    const { result } = renderHook(() => useToTop());

    act(() => {
      result.current.topRef(top);
    });
    result.current.onToTop();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('scrolls the top of the screen back into view when nothing around it scrolls', () => {
    const top = document.createElement('div');
    const scrollIntoView = vi.fn();

    top.scrollIntoView = scrollIntoView;

    const { result } = renderHook(() => useToTop());

    act(() => {
      result.current.topRef(top);
    });
    result.current.onToTop();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('does NOT offer the way up where nothing can tell where the top is', () => {
    const { result } = renderHook(() => useToTop());

    act(() => {
      result.current.topRef(document.createElement('div'));
    });

    expect(result.current.isToTopShown).toBe(false);
  });

  it('stops watching once the top is gone', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);

    const { result } = renderHook(() => useToTop());

    act(() => {
      result.current.topRef(document.createElement('div'));
    });

    const observer = FakeObserver.last;

    act(() => {
      result.current.topRef(null);
    });

    expect(observer?.isDisconnected).toBe(true);
  });
});
