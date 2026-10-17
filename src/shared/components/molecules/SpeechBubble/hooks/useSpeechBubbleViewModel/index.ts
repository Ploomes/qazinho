import type { ISpeechBubbleProps } from '@/shared/components/molecules/SpeechBubble/types';
import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { SPEECH } from '@/shared/components/molecules/SpeechBubble/constants';

export const useSpeechBubbleViewModel = (props: ISpeechBubbleProps) => {
  const { text, onSaid } = props;
  const isStill = useReducedMotion() ?? false;
  const [shown, setShown] = useState({ text, count: 0 });
  const saidFor = useRef<string | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [textHeight, setTextHeight] = useState<number | null>(null);

  const count = shown.text === text ? shown.count : 0;
  const isDone = isStill || count >= text.length;

  if (shown.text !== text) setShown({ text, count: 0 });

  useEffect(() => {
    if (isDone) return;

    const id = window.setInterval(() => {
      setShown((now) =>
        now.text === text
          ? { text, count: Math.min(text.length, now.count + SPEECH.charsPerBeat) }
          : now,
      );
    }, SPEECH.beatMs);

    return () => {
      window.clearInterval(id);
    };
  }, [isDone, text]);

  useEffect(() => {
    const line = textRef.current;

    if (!line || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      setTextHeight(line.offsetHeight);
    });

    observer.observe(line);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isDone || saidFor.current === text) return;

    saidFor.current = text;
    onSaid?.();
  }, [isDone, text, onSaid]);

  return {
    said: isDone ? text : text.slice(0, count),
    unsaid: isDone ? '' : text.slice(count),
    isStreaming: !isDone,
    textRef,
    style:
      textHeight === null
        ? undefined
        : ({ '--speech-text-height': `${String(textHeight)}px` } as CSSProperties),
    onSkip: () => {
      setShown({ text, count: text.length });
    },
  };
};
