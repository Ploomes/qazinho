import type { ISpeechBubbleProps } from '@/components/molecules/SpeechBubble/types';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { SPEECH } from '@/components/molecules/SpeechBubble/constants';

export const useSpeechBubbleViewModel = (props: ISpeechBubbleProps) => {
  const { text, onSaid } = props;
  const isStill = useReducedMotion() ?? false;
  const [shown, setShown] = useState({ text, count: 0 });
  const saidFor = useRef<string | null>(null);

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
    if (!isDone || saidFor.current === text) return;

    saidFor.current = text;
    onSaid?.();
  }, [isDone, text, onSaid]);

  return {
    said: isDone ? text : text.slice(0, count),
    isStreaming: !isDone,
    reserve: text,
    onSkip: () => {
      setShown({ text, count: text.length });
    },
  };
};
