// @vitest-environment jsdom
import type { KeyboardEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useComposerViewModel } from '@/modules/Chat/screens/Chat/components/Composer/hooks/useComposerViewModel';

const PROPS = {
  value: 'Test the whole checkout',
  mentions: [],
  onChange: vi.fn(),
  onSend: vi.fn(),
  onPickMention: vi.fn(),
};

const MENTIONING = {
  ...PROPS,
  value: 'what happened in @r',
  mentions: [
    { kind: 'run' as const, id: 'r-02', title: 'The whole plan', facts: [] },
    { kind: 'run' as const, id: 'r-01', title: 'Checkout only', facts: [] },
  ],
};

function pressed(key: string, shiftKey = false) {
  return {
    key,
    shiftKey,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLInputElement>;
}

describe('useComposerViewModel', () => {
  it('sends what the QA typed', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onSendClick();

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('does NOT send an empty message', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() =>
      useComposerViewModel({ ...PROPS, value: '   ', onSend }),
    );

    expect(result.current.canSend).toBe(false);

    result.current.onSendClick();

    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends on Enter', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onKeyDown(pressed('Enter'));

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('does NOT send on shift-Enter, which is how a second line is typed', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onKeyDown(pressed('Enter', true));

    expect(onSend).not.toHaveBeenCalled();
  });

  describe('the @ picker', () => {
    it('opens while the draft is mentioning something that exists', () => {
      const { result } = renderHook(() => useComposerViewModel(MENTIONING));

      expect(result.current.isPickerOpen).toBe(true);
      expect(result.current.highlighted).toBe(0);
    });

    it('does NOT open when nothing could be mentioned', () => {
      const { result } = renderHook(() => useComposerViewModel(PROPS));

      expect(result.current.isPickerOpen).toBe(false);
    });

    it('moves down and wraps back to the top with the arrows', () => {
      const { result } = renderHook(() => useComposerViewModel(MENTIONING));

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });

      expect(result.current.highlighted).toBe(1);

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });

      expect(result.current.highlighted).toBe(0);

      act(() => {
        result.current.onKeyDown(pressed('ArrowUp'));
      });

      expect(result.current.highlighted).toBe(1);
    });

    it('picks the highlighted reference on Enter, and does NOT send', () => {
      const onSend = vi.fn();
      const onPickMention = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({ ...MENTIONING, onSend, onPickMention }),
      );

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });
      act(() => {
        result.current.onKeyDown(pressed('Enter'));
      });

      expect(onPickMention).toHaveBeenCalledWith('r-01');
      expect(onSend).not.toHaveBeenCalled();
    });

    it('closes on Escape, and opens again once the QA keeps typing', () => {
      const { result, rerender } = renderHook((props) => useComposerViewModel(props), {
        initialProps: MENTIONING,
      });

      act(() => {
        result.current.onKeyDown(pressed('Escape'));
      });

      expect(result.current.isPickerOpen).toBe(false);

      rerender({ ...MENTIONING, value: 'what happened in @r-' });

      expect(result.current.isPickerOpen).toBe(true);
    });

    it('never highlights past the end when the list gets shorter', () => {
      const { result, rerender } = renderHook((props) => useComposerViewModel(props), {
        initialProps: MENTIONING,
      });

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });
      rerender({ ...MENTIONING, mentions: MENTIONING.mentions.slice(0, 1) });

      expect(result.current.highlighted).toBe(0);
    });
  });
});
