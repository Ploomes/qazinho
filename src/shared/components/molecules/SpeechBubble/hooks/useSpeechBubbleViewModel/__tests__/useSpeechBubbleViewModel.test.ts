// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPEECH } from '@/shared/components/molecules/SpeechBubble/constants';
import { useSpeechBubbleViewModel } from '@/shared/components/molecules/SpeechBubble/hooks/useSpeechBubbleViewModel';

const LINE = 'Hi! I am the Intern.';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function beats(count: number) {
  act(() => {
    vi.advanceTimersByTime(SPEECH.beatMs * count);
  });
}

describe('useSpeechBubbleViewModel', () => {
  it('streams the line in a few characters at a time', () => {
    const { result } = renderHook(() => useSpeechBubbleViewModel({ text: LINE }));

    expect(result.current.said).toBe('');
    expect(result.current.isStreaming).toBe(true);

    beats(2);

    expect(result.current.said).toBe(LINE.slice(0, SPEECH.charsPerBeat * 2));
  });

  it('says it is done once the whole line is out, exactly once', () => {
    const onSaid = vi.fn();
    const { result, rerender } = renderHook(() =>
      useSpeechBubbleViewModel({ text: LINE, onSaid }),
    );

    beats(LINE.length);
    rerender();

    expect(result.current.said).toBe(LINE);
    expect(result.current.isStreaming).toBe(false);
    expect(onSaid).toHaveBeenCalledOnce();
  });

  it('starts over from the first character when the line changes', () => {
    const { result, rerender } = renderHook(
      (props: { text: string }) => useSpeechBubbleViewModel(props),
      { initialProps: { text: LINE } },
    );

    beats(4);
    rerender({ text: 'Oi! Eu sou o Estagiário.' });

    expect(result.current.said).toBe('');
    expect(result.current.reserve).toBe('Oi! Eu sou o Estagiário.');
  });

  describe('onSkip', () => {
    it('shows the rest at once for a QA who does not want to wait', () => {
      const onSaid = vi.fn();
      const { result } = renderHook(() =>
        useSpeechBubbleViewModel({ text: LINE, onSaid }),
      );

      act(() => {
        result.current.onSkip();
      });

      expect(result.current.said).toBe(LINE);
      expect(onSaid).toHaveBeenCalledOnce();
    });
  });
});
