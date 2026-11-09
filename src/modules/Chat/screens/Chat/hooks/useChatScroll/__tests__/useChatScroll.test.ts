// @vitest-environment jsdom
import type { ChatMessage } from '@/modules/Chat/types';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChatScroll } from '@/modules/Chat/screens/Chat/hooks/useChatScroll';

function chat(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `m-${String(index + 1)}`,
    kind: 'user' as const,
    at: '09:41',
    text: `message ${String(index + 1)}`,
  }));
}

function scrolledTo(scrollTop: number) {
  const list = document.createElement('div');

  Object.defineProperty(list, 'scrollHeight', { value: 3_000, configurable: true });
  Object.defineProperty(list, 'clientHeight', { value: 400, configurable: true });
  list.scrollTop = scrollTop;
  list.scrollTo = () => undefined;

  return list;
}

describe('useChatScroll', () => {
  /** O cartão de uma run dobra as mensagens dela: sem o que rolar, as antigas sumiam. */
  it('brings older messages by itself while the list has nothing to scroll', () => {
    const { result, rerender } = renderHook(
      (messages: ChatMessage[]) => useChatScroll({ workspaceId: 'w1', messages }),
      { initialProps: chat(70) },
    );
    const list = document.createElement('div');

    Object.defineProperty(list, 'scrollHeight', { value: 400, configurable: true });
    Object.defineProperty(list, 'clientHeight', { value: 400, configurable: true });
    list.scrollTo = () => undefined;
    result.current.listRef.current = list;

    rerender(chat(71));

    expect(result.current.visible).toHaveLength(71);
  });

  it('does NOT bring more while the list is hidden, with no height at all', () => {
    const { result, rerender } = renderHook(
      (messages: ChatMessage[]) => useChatScroll({ workspaceId: 'w1', messages }),
      { initialProps: chat(70) },
    );

    result.current.listRef.current = document.createElement('div');
    rerender(chat(71));

    expect(result.current.visible).toHaveLength(30);
  });

  it('opens on the latest messages, without replaying them as new', () => {
    const { result } = renderHook(() =>
      useChatScroll({ workspaceId: 'w1', messages: chat(70) }),
    );

    expect(result.current.visible).toHaveLength(30);
    expect(result.current.visible[0]?.message.id).toBe('m-41');
    expect(result.current.visible.some(({ isNew }) => isNew)).toBe(false);
  });

  it('marks a message that arrives after the chat opened as new', () => {
    const { result, rerender } = renderHook(
      (messages: ChatMessage[]) => useChatScroll({ workspaceId: 'w1', messages }),
      { initialProps: chat(3) },
    );

    rerender(chat(4));

    expect(result.current.visible.at(-1)).toMatchObject({ isNew: true });
    expect(result.current.visible[0]).toMatchObject({ isNew: false });
  });

  describe('onScroll', () => {
    it('pulls in older messages when the reader reaches the top', () => {
      const { result } = renderHook(() =>
        useChatScroll({ workspaceId: 'w1', messages: chat(70) }),
      );

      act(() => {
        result.current.listRef.current = scrolledTo(10);
        result.current.onScroll();
      });

      expect(result.current.visible).toHaveLength(60);
      expect(result.current.visible[0]?.message.id).toBe('m-11');
    });

    it('does NOT load anything while the reader is away from the top', () => {
      const { result } = renderHook(() =>
        useChatScroll({ workspaceId: 'w1', messages: chat(70) }),
      );

      act(() => {
        result.current.listRef.current = scrolledTo(1_500);
        result.current.onScroll();
      });

      expect(result.current.visible).toHaveLength(30);
    });

    it('starts the next workspace back on its latest messages', () => {
      const { result, rerender } = renderHook(
        (workspaceId: string) => useChatScroll({ workspaceId, messages: chat(70) }),
        { initialProps: 'w1' },
      );

      act(() => {
        result.current.listRef.current = scrolledTo(10);
        result.current.onScroll();
      });
      rerender('w2');

      expect(result.current.visible).toHaveLength(30);
    });
  });

  /**
   * A run segura até o QA responder: o cartão não pode esperar abaixo de onde ele rolou.
   */
  it('brings a question the agent asks into view, even when the reader scrolled up', () => {
    const { result, rerender } = renderHook(
      (questionId: string | null) =>
        useChatScroll({
          workspaceId: 'w1',
          messages: chat(3),
          questionId,
        }),
      { initialProps: null as string | null },
    );
    const list = scrolledTo(10);
    const scrollTo = vi.fn();

    list.scrollTo = scrollTo;
    act(() => {
      result.current.listRef.current = list;
      result.current.onScroll();
    });
    rerender('r-01/q-1');

    expect(scrollTo).toHaveBeenCalledWith({ top: 3_000, behavior: 'smooth' });
  });
});
