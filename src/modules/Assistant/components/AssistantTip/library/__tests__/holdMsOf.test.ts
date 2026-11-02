import { describe, expect, it } from 'vitest';
import { ASSISTANT_TIP } from '@/modules/Assistant/components/AssistantTip/constants';
import { holdMsOf } from '@/modules/Assistant/components/AssistantTip/library/holdMsOf';

describe('holdMsOf', () => {
  it('gives a short line enough time to be noticed', () => {
    expect(holdMsOf('Ok.')).toBe(ASSISTANT_TIP.minHoldMs);
  });

  it('gives a longer line more time, by how long it is', () => {
    const text = 'x'.repeat(60);

    expect(holdMsOf(text)).toBe(60 * ASSISTANT_TIP.holdPerCharMs);
    expect(holdMsOf(text)).toBeGreaterThan(ASSISTANT_TIP.minHoldMs);
  });

  it('never stays forever, however long the line', () => {
    expect(holdMsOf('x'.repeat(1000))).toBe(ASSISTANT_TIP.maxHoldMs);
  });

  it('still shows an empty line for the shortest time', () => {
    expect(holdMsOf('')).toBe(ASSISTANT_TIP.minHoldMs);
  });
});
