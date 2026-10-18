// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { DEVICE_STATE_KEY } from '@/modules/Device/constants';

/** An idle device read "parado" in Portuguese, the word for one whose run was stopped. */
describe('DEVICE_STATE_KEY', () => {
  it.each(['en', 'pt'] as const)(
    'gives every device state a word of its own, in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const words = Object.values(DEVICE_STATE_KEY).map((key) => t(key as never));

      expect(new Set(words).size).toBe(words.length);
    },
  );
});
