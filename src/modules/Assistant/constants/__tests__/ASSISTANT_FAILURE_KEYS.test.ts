import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { ASSISTANT_FAILURE_KEYS, CONFIRM_TEXTS } from '@/modules/Assistant/constants';

describe('ASSISTANT_FAILURE_KEYS', () => {
  it('says a signed-out agent the way the chat does, and anything else as the assistant', () => {
    expect(ASSISTANT_FAILURE_KEYS['agent-signed-out']).toBe(
      'CHAT.FAILED_AGENT_SIGNED_OUT',
    );
    expect(ASSISTANT_FAILURE_KEYS.other).toBe('ASSISTANT.FAILED_OTHER');
    expect(ASSISTANT_FAILURE_KEYS['no-emulator']).toBe('ASSISTANT.FAILED_OTHER');
  });
});

describe('CONFIRM_TEXTS', () => {
  it('asks, confirms and says it was done for each action, in words that exist', () => {
    for (const { title, go, gone } of Object.values(CONFIRM_TEXTS))
      for (const key of [title, go, gone]) expect(i18n.exists(key)).toBe(true);
  });
});
