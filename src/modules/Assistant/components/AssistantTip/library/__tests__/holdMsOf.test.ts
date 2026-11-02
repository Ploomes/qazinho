import { describe, expect, it } from 'vitest';
import { ASSISTANT_TIP } from '@/modules/Assistant/components/AssistantTip/constants';
import { holdMsOf } from '@/modules/Assistant/components/AssistantTip/library/holdMsOf';
import { SPEECH } from '@/shared/components/molecules/SpeechBubble/constants';

const typing = (length: number) =>
  Math.ceil(length / SPEECH.charsPerBeat) * SPEECH.beatMs;

describe('holdMsOf', () => {
  it('gives a short line time to arrive, be typed and be noticed', () => {
    expect(holdMsOf('Ok.')).toBe(
      ASSISTANT_TIP.speakAfterMs + typing(3) + ASSISTANT_TIP.minHoldMs,
    );
  });

  it('gives a longer line more time to be read, by how long it is', () => {
    expect(holdMsOf('x'.repeat(60))).toBe(
      ASSISTANT_TIP.speakAfterMs + typing(60) + 60 * ASSISTANT_TIP.holdPerCharMs,
    );
  });

  it('caps the reading, however long the line', () => {
    expect(holdMsOf('x'.repeat(1000))).toBe(
      ASSISTANT_TIP.speakAfterMs + typing(1000) + ASSISTANT_TIP.maxHoldMs,
    );
  });

  it('still holds an empty line for the shortest time', () => {
    expect(holdMsOf('')).toBe(ASSISTANT_TIP.speakAfterMs + ASSISTANT_TIP.minHoldMs);
  });
});
